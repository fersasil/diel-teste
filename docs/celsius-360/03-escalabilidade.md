# 3. Escalabilidade, concorrência e multi-threading

Um volume de 20 GB/dia de pacotes JSON (cerca de 180 bytes por pacote)
equivale a cerca de 115 milhões de pacotes/dia (cerca de 1.330 pacotes/segundo
em média, com picos de 3.000 a 5.000 msg/s). Como cada pacote traz 12
amostras, são 1,38 bilhão de amostras térmicas por dia (cerca de 16.000
pontos/segundo).

## 3.1. ADR: Node.js/TypeScript e multi-threading

Em ingestão IoT de alta performance, linguagens como Rust (tokio + serde)
oferecem abstrações de custo zero, ausência de pausas de garbage collector e
baixo uso de memória por worker.

Para este projeto, a escolha é Node.js (NestJS com FastifyAdapter) +
TypeScript:

O processamento pesado de séries, indexação e agregação de janelas de 30
dias fica no TimescaleDB (C). O roteamento de mensagens fica no
EMQX/Mosquitto. O armazenamento bruto fica no MinIO (Go). Os serviços em
Node orquestram I/O assíncrono e validam domínio.

Para aproximar o Node de um runtime multi-thread e evitar bloqueio do event
loop ou pressão no garbage collector do V8, o `ingestion-worker` divide o
trabalho em três camadas:

```text
+-----------------------------------------------------------------------------------+
|                  Processo MQTT Consumer (ingestion-worker)                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | 1. Main Thread (Event Loop - Non-blocking I/O via epoll/kqueue)             |  |
|  | - Recebe pacotes do socket MQTT em alta velocidade                          |  |
|  | - Acumula em Buffer de Micro-Batch (ex: 2.000 pacotes)                      |  |
|  | - Dispara Bulk INSERT assíncrono para o TimescaleDB e PutObject pro MinIO   |  |
|  +-------------------+-------------------------------------+-------------------+  |
|                      | Offload CPU-bound                   | Offload Compressão   |
|                      v (node:worker_threads)               v (libuv C++ Threads)  |
|  +---------------------------------------+   +---------------------------------+  |
|  | 2. JS Worker Thread Pool (Piscina)    |   | 3. libuv Native Thread Pool     |  |
|  | - Thread 1..N (1 por vCPU):           |   | - UV_THREADPOOL_SIZE = 16       |  |
|  |   * JSON.parse de milhares de pacotes |   | - Executa zlib.gzip() em C++    |  |
|  |   * Unrolling (12 amostras/pacote)    |   |   nativo fora da Main Thread    |  |
|  |   * Cálculo de Timezone e Conforto    |   | - Criptografia / Hash SHA-256   |  |
|  +---------------------------------------+   +---------------------------------+  |
+-----------------------------------------------------------------------------------+
```

Camada 1, event loop para I/O: sockets MQTT, pool do PostgreSQL e cliente S3,
sem threads bloqueadas.

Camada 2, thread pool nativo da libuv (`UV_THREADPOOL_SIZE=16`): `zlib.gzip()`
roda em threads C++ fora do event loop.

Camada 3, `node:worker_threads` (Piscina): `JSON.parse`, desmembramento das
12 amostras, fuso horário e conforto vão em lote para worker threads. O
event loop lag permanece abaixo de 5 ms.

Camada 4, evolução futura: se o volume chegar a 2 TB/dia, o
`ingestion-worker` pode ser reescrito em Rust via N-API sem alterar a API nem
o frontend, porque o pipeline é desacoplado pelo broker MQTT.

## 3.2. Micro-batch e backpressure

MinIO/S3: o worker acumula os pacotes crus e faz flush a cada 5.000 pacotes
ou 5 segundos. O lote é compactado com `zlib.gzip` e salvo como um objeto
`.jsonl.gz` particionado por data:
`s3://diel-raw-telemetry/dt=YYYY-MM-DD/hour=HH/batch_<uuid>.jsonl.gz`.

TimescaleDB: depois que a worker thread desmembra e enriquece o lote, um
único multi-row bulk upsert grava as amostras:

`INSERT INTO telemetry_samples ... ON CONFLICT (environment_id, sample_time) DO UPDATE ...`

O flush da série ocorre a cada 2.000 amostras ou 1 segundo.

Backpressure (QoS 1): se o banco atrasar e o buffer em memória atingir o
limite de segurança, o worker pausa o PUBACK. O broker retém as mensagens.

## 3.3. Leitura

Continuous aggregate `cagg_environment_hourly`: a listagem de centenas de
lojas responde em menos de 30 ms.

Estado atual desnormalizado (`environments.last_*`): status ONLINE/OFFLINE,
última temperatura e conforto atual ficam nessa tabela, consultados por
índice B-Tree.

Downsampling e gapfill na tela 2: `time_bucket_gapfill()` gera a série com
lacunas visíveis de indisponibilidade.
