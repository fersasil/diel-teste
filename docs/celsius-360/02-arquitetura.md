# 2. Arquitetura do sistema

Para garantir resiliência, isolamento de falhas e capacidade de escalar
horizontalmente a ingestão de dados sem afetar a performance da API REST dos
usuários, a plataforma usa microsserviços desacoplados.

- Simulador / produtor MQTT: lê o arquivo `telemetrias.jsonl` e publica os
  pacotes no broker MQTT, um a um, em QoS 1. O log avança a cada mil.
- Broker MQTT (EMQX / Mosquitto): barramento central, com assinaturas
  compartilhadas (shared subscriptions).
- MQTT Consumer Service (`ingestion-worker`): escuta o broker, faz o parse
  dos payloads, executa o unrolling das amostras, salva lotes crus no MinIO
  (S3) e faz o bulk insert enriquecido no TimescaleDB.
- API Gateway / Backend Service (`api-server`): NestJS. Expõe REST e
  WebSockets para o frontend (Next.js). Consulta TimescaleDB e Redis.
- PostgreSQL + TimescaleDB: cadastro e séries temporais tratadas.
- MinIO / Amazon S3: data lake de longo prazo dos pacotes brutos compactados.
- Redis: cache, relógio virtual e pub/sub para o WebSocket.
- Stack PLG (Prometheus + Loki + Grafana): observabilidade unificada.

```text
                                    +--------------------------+
                                    |  Simulador IoT (Stream)  |
                                    |    telemetrias.jsonl     |
                                    +------------+-------------+
                                                 | MQTT (QoS 1)
                                                 v
                                    +--------------------------+
                                    |   Broker MQTT (EMQX)     |
                                    |  Shared Subscriptions    |
                                    +------------+-------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                         |                         |
                       v                         v                         v
             +-------------------+     +-------------------+     +-------------------+
             | MQTT Consumer 1   |     | MQTT Consumer 2   |     | MQTT Consumer N   |
             | (ingestion-worker)|     | (ingestion-worker)|     | (ingestion-worker)|
             | réplica da ingestão|     | réplica da ingestão|     | réplica da ingestão|
             +---------+---------+     +---------+---------+     +---------+---------+
                       |                         |                         |
                       +-------------------------+-------------------------+
                                                 |
                 +-------------------------------+-------------------------------+
                 |                               |                               |
     Batch Flush | (Dado Cru - 20GB/dia)         | Estado Quente / Cache         | Batch Upsert
                 v                               v                               v
+---------------------------------+   +---------------------+   +---------------------------------+
|         MinIO (AWS S3)          |   |        Redis        |   |    PostgreSQL + TimescaleDB     |
| - Bucket: diel-raw-telemetry    |   | - Virtual Clock     |   | - Tabelas Relacionais (RBAC)    |
| - Particionado: dt=YYYY-MM-DD/  |   | - Env Metadata Map  |   | - Hypertable: telemetry_samples |
| - Formato: .jsonl.gz (GZIP)     |   | - Pub/Sub WebSocket |   | - Continuous Aggregates (1h)    |
+---------------------------------+   +----------+----------+   +----------------+----------------+
                                                 |                               |
                                                 v                               v
                                    +-----------------------------------------------+
                                    |       API Gateway (api-server)                |
                                    |        NestJS REST API + WebSockets           |
                                    +-----------------------+-----------------------+
                                                            |
                                                            v
                                            +-------------------------------+
                                            |       Frontend (Next.js)      |
                                            |     Visão Rede & Detalhe      |
                                            +-------------------------------+
```

## 2.1. Vantagens de separar o MQTT Consumer da API REST

Isolamento de falhas (bulkhead): se houver um pico de dispositivos enviando
pacotes em atraso (`saved_data`), o `ingestion-worker` absorve a carga de CPU
e I/O de escrita. O `api-server` continua respondendo para gerentes e
gestores no painel.

Escalonamento independente: em produção, 3 réplicas do `ingestion-worker`
podem cuidar da ingestão MQTT, e 1 ou 2 réplicas do `api-server` atendem o
HTTP do frontend.

Manutenibilidade: o consumer lida com sockets MQTT, buffers de lote e
compressão. A API lida com autenticação JWT, RBAC por perfil e o JSON para o
cliente.
