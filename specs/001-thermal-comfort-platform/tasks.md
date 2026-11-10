# Tasks: Celsius 360 Lite

**Input**: Design documents from `/specs/001-thermal-comfort-platform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos. A constituição (princípio I) exige suíte unitária e suíte e2e no Docker Compose. Escreva o teste, veja falhar, depois implemente.

**Organization**: Uma fase por história, para implementar e testar cada uma sem depender das outras.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem depender de tarefa incompleta)
- **[Story]**: História da spec (`US1` … `US7`)
- Setup, fundação e polimento não levam história

## Path Conventions

- `apps/ingestion-worker/src/`, `apps/api-server/src/`, `apps/web/src/`
- `apps/simulator/`, `db/migrations/`, `db/seed/`
- Teste unitário ao lado do service (`*.test.ts`). E2E em `apps/api-server/test/e2e/` ou `apps/ingestion-worker/test/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repositório e stack vazia, no formato do plan.md

- [X] T001 Criar os diretórios `apps/ingestion-worker`, `apps/api-server`, `apps/web`, `apps/simulator`, `db/migrations` e `db/seed` conforme `specs/001-thermal-comfort-platform/plan.md`
- [X] T002 [P] Inicializar o pacote TypeScript Node.js 22 do worker em `apps/ingestion-worker/package.json`
- [X] T003 [P] Inicializar NestJS com Fastify em `apps/api-server/package.json`
- [X] T004 [P] Inicializar Next.js em `apps/web/package.json`
- [X] T005 [P] Criar `.env.example` na raiz só com nome e placeholder, sem segredo real
- [X] T006 [P] Criar `docker-compose.yml` com TimescaleDB, Redis, MinIO, EMQX, Prometheus, Loki, Grafana, migrate, worker, API, web, simulador, `unit-tests` e `e2e-tests`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, processo e autenticação do pedido. Nenhuma história começa antes disto.

**⚠️ CRITICAL**: Nenhuma história começa antes do fim desta fase.

- [X] T007 Criar `db/migrations/001_cadastro.sql` com `clients`, `stores`, `environments` e `users`. `stores.uf` tem 2 letras. `stores.timezone` é fuso IANA. `environments.comfortMin` é menor ou igual a `comfortMax`. `lastComfortStatus` é `IN_RANGE`, `ABOVE`, `BELOW` ou nulo. `lastSeenAt` nulo significa `NO_DATA`. `users.profile` é `network_manager`, `store_manager` ou `diel_operator`. Gestor e gerente exigem `clientId`. Gerente exige `allowedStoreIds` desse cliente. Operador tem `clientId` nulo e lista vazia. `deviceId` é único
- [X] T008 [P] Criar `db/migrations/002_series.sql` com hypertable `telemetry_samples` (única em `environmentId, sampleTime`, temperatura de −10 a 60 inclusive), `telemetry_anomalies`, `external_weather` (única em `storeId, readingTime`) e a continuous aggregate horária
- [X] T009 [P] Criar `db/migrations/003_raw_batches.sql` com `batchKey`, `clientId`, `recordedAt` e `packetCount`, sem o corpo do objeto
- [X] T010 [P] Criar os models de cadastro em `apps/api-server/src/models/cadastro.ts` com os mesmos limites de T007
- [X] T011 [P] Criar os models de série em `apps/ingestion-worker/src/models/telemetry.ts` com a chave única e a faixa −10 a 60 inclusive
- [X] T012 [P] Criar o pool `pg` em `apps/api-server/src/repositories/pg-pool.ts`
- [X] T013 [P] Criar o pool `pg` em `apps/ingestion-worker/src/repositories/pg-pool.ts`
- [X] T014 [P] Criar `apps/api-server/src/http/authenticate-request.ts` rejeitando pedido sem token. O escopo lido do token não é decidido pelo frontend
- [X] T015 [P] Subir a API com log JSON Pino e `/metrics` em `apps/api-server/src/main.ts`
- [X] T016 [P] Subir o worker com log JSON e `/metrics` em `apps/ingestion-worker/src/main.ts`, sem importar a API
- [X] T017 [P] Criar o emissor de token de teste em `apps/api-server/test/support/sign-token.ts`
- [X] T018 [P] Criar a fixture dos clientes A e B em `db/seed/fixtures.sql`
- [X] T019 Fazer `docker-compose.yml` aplicar as migrations na subida e rodar `unit-tests` e `e2e-tests` dentro do Compose

**Checkpoint**: Fundação pronta. Histórias podem seguir em paralelo.

---

## Phase 3: User Story 1 - Ver a rede fora de conforto (Priority: P1) 🎯 MVP

**Goal**: Uma linha por loja, com quantos ambientes estão dentro, acima, abaixo e sem dados.

**Independent Test**: Com a fixture e leituras já aceitas, o gestor acha a loja cuja contagem acima ou abaixo é maior que zero. A listagem de centenas de lojas responde em menos de 30 ms no banco.

### Tests for User Story 1

- [X] T020 [P] [US1] Teste unitário em `apps/api-server/src/services/store-counts.test.ts`: `noDataCount` só quando `lastSeenAt` é nulo; as outras três usam `lastComfortStatus`; as quatro somam o total de ambientes
- [X] T021 [P] [US1] E2E de `GET /api/v1/stores` em `apps/api-server/test/e2e/stores.e2e.ts`: `page` padrão 1, `pageSize` padrão 50 e máximo 100, meta de 30 ms

### Implementation for User Story 1

- [X] T022 [US1] Implementar `apps/api-server/src/repositories/store-list.repository.ts` lendo `environments.last_*`, sem varrer `telemetry_samples`
- [X] T023 [US1] Implementar `apps/api-server/src/services/list-stores.service.ts` com um único caso de uso e o escopo do token
- [X] T024 [US1] Implementar `GET /stores` em `apps/api-server/src/http/stores.controller.ts` conforme `contracts/http-api.md`
- [X] T025 [US1] Implementar a visão da rede em `apps/web/src/app/rede/page.tsx`, texto em português, só exibindo as contagens recebidas

**Checkpoint**: A visão da rede funciona sozinha com a fixture.

---

## Phase 4: User Story 2 - Investigar um ambiente (Priority: P1)

**Goal**: Série com balde inicial de 30 minutos, escolha de 1 hora, 1 dia, 1 semana ou 1 mês, lacuna sem temperatura inventada.

**Independent Test**: Um ambiente com buraco mostra média, mínima, máxima e expediente no balde escolhido, sem preencher o buraco.

### Tests for User Story 2

- [X] T026 [P] [US2] Teste unitário em `apps/api-server/src/services/timeseries-bucket.test.ts`: ausência vale `30m`; aceita `30m`, `1h`, `1d`, `1w` e `1mo`; rejeita `15m`; outro balde é `INVALID_BUCKET`
- [X] T027 [P] [US2] E2E em `apps/api-server/test/e2e/timeseries.e2e.ts` para o detalhe e a série, com balde vazio de temperaturas nulas

### Implementation for User Story 2

- [X] T028 [US2] Implementar `apps/api-server/src/repositories/timeseries.repository.ts` com `time_bucket_gapfill` e temperatura nula no balde vazio
- [X] T029 [US2] Implementar `apps/api-server/src/services/get-timeseries.service.ts`
- [X] T030 [US2] Implementar `apps/api-server/src/services/get-environment-summary.service.ts`. O percentual é amostras `IN_RANGE` no expediente dividido pelas amostras no expediente. Sem amostra no expediente, o percentual vem nulo
- [X] T031 [US2] Implementar `GET /environments/:id/summary` e `GET /environments/:id/timeseries` em `apps/api-server/src/http/environment.controller.ts`. Ambiente de outro cliente responde `NOT_FOUND`
- [X] T032 [US2] Implementar `apps/web/src/app/ambientes/[id]/page.tsx` com seletor de 30 minutos, 1 hora, 1 dia, 1 semana e 1 mês, abrindo em 30 minutos, lacuna visível e texto em português

**Checkpoint**: O detalhe funciona sem a visão da rede.

---

## Phase 5: User Story 3 - Entrar só no próprio alcance (Priority: P1)

**Goal**: Login, escopo por persona e foco de um cliente para o operador Diel.

**Independent Test**: Gestor e gerente de A não veem loja de B. Operador sem foco recebe lista vazia. Com foco em A, não vê B. Credencial inválida não abre sessão.

### Tests for User Story 3

- [X] T033 [P] [US3] Teste unitário em `apps/api-server/src/services/access-scope.test.ts` para os três perfis e as regras de `clientId` e `allowedStoreIds` de T007
- [X] T034 [P] [US3] E2E em `apps/api-server/test/e2e/auth.e2e.ts`: `INVALID_CREDENTIALS`, zero lojas do outro cliente, `CLIENT_FOCUS_REQUIRED`, `FORBIDDEN` no foco para gestor e gerente

### Implementation for User Story 3

- [X] T035 [US3] Implementar `apps/api-server/src/repositories/user.repository.ts` devolvendo model, sem vazar `passwordHash` na resposta
- [X] T036 [US3] Implementar `apps/api-server/src/services/login.service.ts`
- [X] T037 [US3] Implementar `apps/api-server/src/services/focus-client.service.ts` gravando o foco no Redis, não no token
- [X] T038 [US3] Implementar `POST /auth/login` e `POST /auth/focus-client` em `apps/api-server/src/http/auth.controller.ts`
- [X] T039 [US3] Implementar `apps/web/src/app/entrar/page.tsx` e o seletor do operador. A frase de erro fica nesta tela, em português. O código de erro da API permanece em inglês

**Checkpoint**: Os três perfis entram e o isolamento entre clientes passa no e2e.

---

## Phase 6: User Story 4 - Saber se o sensor está presente (Priority: P2)

**Goal**: `NO_DATA`, `ONLINE` e `OFFLINE` contra o relógio virtual, na rede e no detalhe.

**Independent Test**: Três ambientes (leitura recente, leitura antiga, nenhuma leitura) mostram os três status.

### Tests for User Story 4

- [X] T040 [P] [US4] Teste unitário em `apps/api-server/src/services/device-status.test.ts`: `NO_DATA` se `lastSeenAt` é nulo; `ONLINE` até 15 minutos; `OFFLINE` acima de 15 minutos, sempre contra `system:virtual_now`
- [X] T041 [P] [US4] E2E em `apps/api-server/test/e2e/device-status.e2e.ts`

### Implementation for User Story 4

- [X] T042 [US4] Implementar `apps/api-server/src/services/device-status.service.ts` com as regras de 15 minutos citadas em T040
- [X] T043 [US4] Implementar `apps/api-server/src/repositories/store-presence.repository.ts` com `onlineCount` e `offlineCount`
- [X] T044 [US4] Incluir presença em `apps/api-server/src/http/stores.controller.ts` e `deviceStatus` em `apps/api-server/src/http/environment.controller.ts`
- [X] T045 [US4] Mostrar o status em português em `apps/web/src/components/device-status.tsx`, usado pela rede e pelo detalhe

**Checkpoint**: A presença aparece nas duas telas sem recalcular no browser.

---

## Phase 7: User Story 5 - Confiar na leitura (Priority: P2)

**Goal**: Unrolling, anomalia, pacote atrasado, upsert idempotente e PUBACK só depois das duas gravações.

**Independent Test**: 80 °C vira anomalia, 60 °C entra, o reenvio deixa uma linha, o pacote atrasado fica na hora histórica e a falha de um destino retém o ACK.

### Tests for User Story 5

- [X] T046 [P] [US5] Teste unitário em `apps/ingestion-worker/src/services/enrich-packet.test.ts`. A amostra `i` ocorre em `timestamp - (N - 1 - i) * intervalSeconds`. A última coincide com `timestamp`. Fora de −10 a 60 é `OUT_OF_RANGE`. −10 e 60 permanecem. `savedData` marca `isDelayedPacket`
- [X] T047 [P] [US5] E2E em `apps/ingestion-worker/test/e2e/ingest.e2e.ts` para ACK, replay, anomalia e atraso

### Implementation for User Story 5

- [X] T048 [P] [US5] Implementar o enriquecimento em worker thread em `apps/ingestion-worker/src/services/enrich-packet.service.ts`
- [X] T049 [P] [US5] Implementar `apps/ingestion-worker/src/services/raw-batch-writer.service.ts`. GZIP fora do event loop. A chave do objeto é o hash dos pacotes do lote
- [X] T050 [US5] Implementar o upsert em `apps/ingestion-worker/src/repositories/sample.repository.ts` na chave `(environmentId, sampleTime)`
- [X] T051 [P] [US5] Implementar `apps/ingestion-worker/src/repositories/anomaly.repository.ts` com `reason` `OUT_OF_RANGE` ou `UNKNOWN_DEVICE`
- [X] T052 [US5] Implementar `apps/ingestion-worker/src/services/ack-gate.service.ts`: PUBACK só depois do objeto e do commit
- [X] T053 [P] [US5] Implementar `apps/ingestion-worker/src/services/advance-clock.service.ts`. `system:virtual_now` só avança
- [X] T054 [US5] Ligar o lote em `apps/ingestion-worker/src/services/consume-batch.service.ts`
- [X] T055 [P] [US5] Publicar `telemetrias.jsonl` em QoS 1 a partir de `apps/simulator/src/publish.ts`

**Checkpoint**: A ingestão prova durabilidade e idempotência sem a tela.

---

## Phase 8: User Story 6 - Comparar com o clima externo (Priority: P3)

**Goal**: A série externa da cidade aparece no detalhe e não muda a faixa do ambiente. Ausência não falha o pedido.

**Independent Test**: Com clima no período, a série externa vem junto. Sem clima, o detalhe interno continua 200 e a faixa não muda.

### Tests for User Story 6

- [X] T056 [P] [US6] Teste unitário em `apps/api-server/src/services/attach-external-weather.test.ts`: a série externa não altera `comfortMin` nem `comfortMax`; lista vazia não é erro
- [X] T057 [P] [US6] E2E em `apps/api-server/test/e2e/weather.e2e.ts`

### Implementation for User Story 6

- [X] T058 [US6] Implementar `apps/api-server/src/repositories/external-weather.repository.ts`
- [X] T059 [US6] Implementar `apps/api-server/src/services/attach-external-weather.service.ts`
- [X] T060 [US6] Anexar `external` na resposta de `apps/api-server/src/http/environment.controller.ts`

**Checkpoint**: O clima é contexto, não regra de conforto.

---

## Phase 9: User Story 7 - Recuperar o pacote original (Priority: P3)

**Goal**: Operador no cliente em foco e gestor do próprio cliente listam o lote do dia. Gerente não lista. A resposta não traz o corpo.

**Independent Test**: Gestor de A vê o lote daquele dia. Gerente recebe `FORBIDDEN`. Operador sem foco não recebe lote.

### Tests for User Story 7

- [X] T061 [P] [US7] Teste unitário em `apps/api-server/src/services/list-raw-batches.test.ts` para gestor, gerente e operador sem foco
- [X] T062 [P] [US7] E2E em `apps/api-server/test/e2e/raw-batches.e2e.ts`

### Implementation for User Story 7

- [X] T063 [US7] Implementar `apps/api-server/src/repositories/raw-batch.repository.ts` devolvendo `batchKey`, `recordedAt` e `packetCount`
- [X] T064 [US7] Implementar `apps/api-server/src/services/list-raw-batches.service.ts`
- [X] T065 [US7] Implementar `GET /storage/raw-batches` em `apps/api-server/src/http/raw-batches.controller.ts`

**Checkpoint**: A auditoria do lote não vaza para o gerente nem para outro cliente.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Tempo real, observabilidade e a validação do quickstart

- [X] T066 [P] Emitir `environment.updated` em `apps/api-server/src/http/live.gateway.ts` conforme `contracts/websocket.md`, sem senha, token, e-mail ou corpo do lote
- [X] T067 [P] Atualizar a rede e o detalhe sem recarregar em `apps/web/src/components/live-refresh.tsx`
- [X] T068 [P] Centralizar o texto visível em português em `apps/web/src/messages/pt-BR.ts`
- [X] T069 [P] Raspar `/metrics` em `deploy/observability/prometheus.yml` para o worker e a API
- [X] T070 Rodar os 13 cenários de `specs/001-thermal-comfort-platform/quickstart.md` com `docker compose run --rm e2e-tests`
- [X] T071 Conferir que código de aplicação, teste e migration não passam de 300 linhas e que toda variável lida está no `.env.example`. `spec.md` e `tasks.md` ficam fora desse limite

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: começa agora
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias
- **Histórias (Phase 3+)**: dependem da fundação, não uma da outra, salvo onde a nota abaixo diz integração
- **Polish (Phase 10)**: depois das histórias desejadas

### User Story Dependencies

- **US1 (P1)**: depois da fundação. Não depende de outra história. MVP
- **US2 (P1)**: depois da fundação. Testável com um ambiente semeado, sem a visão da rede
- **US3 (P1)**: depois da fundação. Substitui o token de teste pelo login real
- **US4 (P2)**: depois da fundação. Integra contagem na linha da US1 e status no detalhe da US2, mas o service de presença testa sozinho
- **US5 (P2)**: depois da fundação. Não precisa da tela
- **US6 (P3)**: o service testa sozinho. A resposta HTTP integra com o controller da US2
- **US7 (P3)**: autorização testa sozinha com a tabela de lotes. O objeto real no MinIO integra com a US5

### Within Each User Story

- Teste primeiro, e falhando, antes do service
- Repository antes do service, service antes do controller
- Um service, um caso de uso, um arquivo de até 300 linhas

### Parallel Opportunities

- T002–T006 em paralelo depois de T001
- T007–T018 em paralelo, arquivos diferentes
- Os testes `[P]` de uma mesma história em paralelo
- Depois da fundação, US1, US2, US3 e US5 podem andar juntas
- Exemplo da US1: T020 e T021 juntos; depois T022, T023, T024 e T025
- US4 e US6 não editam `environment.controller.ts` ao mesmo tempo

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Terminar Phase 1 e Phase 2
2. Terminar Phase 3 (US1)
3. Parar e rodar o teste independente da visão da rede
4. Só então seguir para US2 e US3

### Incremental Delivery

1. Fundação pronta
2. US1 demonstra a rede
3. US2 acrescenta o detalhe
4. US3 fecha o isolamento entre clientes
5. US4, US5, US6 e US7 entram sem quebrar o que já passou

### Parallel Team Strategy

Com a fundação pronta: uma pessoa na US1, outra na US2, outra na US5. US3 encaixa no login sem reescrever a listagem.

---

## Notes

- `[P]` significa arquivo diferente e sem dependência incompleta
- Não calcular conforto, expediente nem autorização no frontend
- Pare em qualquer checkpoint e valide só aquela história
