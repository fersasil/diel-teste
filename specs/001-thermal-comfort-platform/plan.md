# Implementation Plan: Celsius 360 Lite

**Branch**: `001-thermal-comfort-platform` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-thermal-comfort-platform/spec.md`

## Summary

Gestores veem, por loja, quantos ambientes estão dentro, acima, abaixo ou sem
dados, e abrem a série de até 30 dias com agrupamento de 15 minutos, 30
minutos ou 1 hora. O acesso separa gestor, gerente e operador Diel.

A ingestão fica num processo próprio. Ela só confirma a leitura depois de
arquivar o lote cru e gravar a série tratada. A API lê o estado já calculado
e não recalcula conforto. O desenho está em [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/) e
[quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript no Node.js 22. API NestJS com Fastify.
Frontend Next.js.

**Primary Dependencies**: Cliente MQTT, pool de `worker_threads` (Piscina),
cliente S3, `pg`, Redis, JWT, Pino, Prometheus.

**Storage**: PostgreSQL com TimescaleDB para cadastro e série tratada. MinIO
para o lote cru GZIP. Redis para o relógio virtual, o cliente em foco do
operador e o aviso de leitura nova.

**Testing**: Suíte unitária e suíte e2e, as duas dentro do Docker Compose.
Unitário cobre regra de domínio sem rede. E2E publica MQTT e consulta a API.

**Target Platform**: Stack Docker Compose local. Serviços Linux.

**Project Type**: Web multi-serviço. Worker de ingestão, API e frontend.

**Performance Goals**: Listagem de centenas de lojas em menos de 30 ms no
banco. Série de 30 dias em menos de 100 ms no banco. Event loop do worker
abaixo de 5 ms. Painel segue respondendo em pico de 3.000 a 5.000 leituras
por segundo.

**Constraints**: Arquivo escrito à mão até 300 linhas. Um service, um caso de
uso. Query só em repository. Schema só por migration. Texto de tela em
português. Código, log e código de erro em inglês. Segredo só por ambiente.
Variável nova entra no `.env.example`.

**Scale/Scope**: 20 GB/dia de leitura bruta. Duas telas. Três personas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano cumpre | Resultado |
|-----------|---------------------|-----------|
| I. Testes na stack Docker | Unitário e e2e rodam no Compose. Ver [quickstart.md](./quickstart.md). | Pass |
| II. Isolamento da ingestão | `ingestion-worker` e `api-server` são processos diferentes. A API não consome MQTT. | Pass |
| III. Lago desacoplado | Lote cru no MinIO. Série e listagem no TimescaleDB e no Redis. | Pass |
| IV. Node orquestra | Conforto em worker thread. GZIP na libuv. Agregação no TimescaleDB. | Pass |
| V. RBAC e observabilidade | Escopo no servidor. `/metrics` e log JSON. Loki e Grafana na stack. | Pass |
| VI. Idioma | Códigos em inglês. Frases da tela em português. | Pass |
| VII. Tamanho | Services de um caso de uso. Arquivos até 300 linhas. | Pass |
| VIII. Persistência | Migration SQL na subida. Model e repository. | Pass |
| IX. ACK após durabilidade | PUBACK só depois do objeto e do upsert. | Pass |
| X. Idempotência | Upsert por ambiente e instante. Chave de objeto estável. | Pass |
| XI. Regra no backend | Frontend só exibe o JSON da API. | Pass |
| XII. UTC e fuso | `timestamptz`. Expediente no fuso da loja. | Pass |
| XIII. Segredos | Credencial por variável de ambiente. | Pass |
| XIV. `.env.example` | Catálogo único na raiz, só com placeholder. | Pass |

Nenhuma violação. A tabela de complexidade fica vazia.

## Project Structure

### Documentation (this feature)

```text
specs/001-thermal-comfort-platform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-api.md
│   ├── mqtt-packet.md
│   └── websocket.md
├── spec.md
└── tasks.md              # fase seguinte, não criada aqui
```

### Source Code (repository root)

```text
apps/ingestion-worker/src/
├── models/
├── repositories/
└── services/             # um caso de uso por arquivo
apps/api-server/src/
├── models/
├── repositories/
├── services/
└── http/
apps/web/src/             # Next.js, texto em português
apps/simulator/
db/migrations/            # SQL versionado, cada arquivo até 300 linhas
docker-compose.yml
.env.example
```

**Structure Decision**: Três aplicações de produto mais o simulador. O
worker não importa a API. A API não abre socket MQTT. O frontend não contém
cálculo de conforto, expediente nem autorização.

## Post-Design Constitution Check

Revisto depois de `research.md`, `data-model.md`, `contracts/` e
`quickstart.md`. Os contratos devolvem conforto e status já calculados. A
série não lê o MinIO. O lote original é endpoint próprio, só para operador
focado e gestor. O ACK continua condicionado às duas gravações. O gate
permanece aprovado, sem violação nova.

## Complexity Tracking

Nenhuma violação da constituição precisa de justificativa.
