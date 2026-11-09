# Research: Celsius 360 Lite

Decisões fechadas a partir da constituição, da especificação e de
`docs/celsius-360/`. Não restou `NEEDS CLARIFICATION`.

## 1. Runtime e separação de processos

- **Decision**: Node.js 22 e TypeScript. API em NestJS com Fastify. Frontend
  em Next.js. Ingestão num processo separado.
- **Rationale**: A constituição fixa o runtime e o bulkhead. O banco, o
  broker e o MinIO fazem o trabalho pesado.
- **Alternatives considered**: Rust no worker foi rejeitado para a v1. A
  constituição só permite essa troca se o volume deixar de caber, sem mudar
  os contratos.

## 2. Onde cada dado mora

- **Decision**: Série tratada e cadastro no TimescaleDB. Lote cru GZIP no
  bucket `diel-raw-telemetry`, partição `dt=YYYY-MM-DD/hour=HH/`. Relógio
  virtual, foco do operador e aviso de tela no Redis.
- **Rationale**: A listagem usa o estado desnormalizado do ambiente e a
  continuous aggregate horária. A tela não varre o arquivo.
- **Alternatives considered**: Guardar o cru no próprio Postgres foi
  rejeitado pelo volume de 20 GB/dia.

## 3. Confirmação da leitura

- **Decision**: O worker acumula o lote e só envia PUBACK depois do
  `PutObject` e do commit do upsert. Falha de um dos dois retém o ACK.
- **Rationale**: QoS 1 sem as duas gravações confirmaria uma leitura perdida.
- **Alternatives considered**: Confirmar no recebimento e gravar depois foi
  rejeitado. Um processo cai no meio e a leitura some.

## 4. Idempotência

- **Decision**: Amostra única em `(environment_id, sample_time)`. Reenvio do
  mesmo pacote regrava os mesmos valores. A chave do objeto no MinIO é o
  hash do conjunto de pacotes do lote, então o retry substitui o mesmo
  objeto.
- **Rationale**: A spec exige uma temperatura, um expediente e um conforto
  para o mesmo par ambiente e instante.
- **Alternatives considered**: Inserir de novo e deduplicar na leitura foi
  rejeitado. Duplicaria a série e o resumo horário.

## 5. Enriquecimento

- **Decision**: Parse, unrolling, fuso e conforto rodam em pool de
  `worker_threads`. `zlib.gzip` roda no thread pool da libuv
  (`UV_THREADPOOL_SIZE=16`). O event loop só faz I/O.
- **Rationale**: Meta de atraso do event loop abaixo de 5 ms.
- **Alternatives considered**: Fazer o parse no event loop foi rejeitado.
  Em pico de 5.000 msg/s ele pararia o ACK e o flush.

## 6. Regras de domínio

- **Decision**: Unrolling `T(i) = T(utc) - (N - 1 - i) * intervalo`, com o
  índice 0 mais antigo. Faixa inclusiva de −10 °C a 60 °C. Fora disso,
  anomalia e ausência na série. Conforto `IN_RANGE`, `ABOVE` ou `BELOW`.
  Expediente é agenda semanal no fuso da loja. Intervalo que termina antes
  de começar cruza a meia-noite. Feriado fica fora da v1. Status `ONLINE`
  até 15 min, `OFFLINE` acima disso, `NO_DATA` sem leitura. O relógio é
  `system:virtual_now`, e ele só avança.
- **Rationale**: São as regras já ratificadas. A agenda semanal cobre a
  premissa da spec sem inventar calendário de feriado.
- **Alternatives considered**: Usar o relógio de parede foi rejeitado. Um
  pacote atrasado marcaria a loja como offline no meio do replay.

## 7. Listagem e série

- **Decision**: A linha da loja agrega `environments.last_comfort_status` e
  `last_seen_at` em quatro contagens de conforto e três de presença. A série
  usa `time_bucket_gapfill` com balde de 15, 30 ou 60 minutos, padrão 30.
  Janela máxima de 30 dias. Balde vazio volta lacuna, não temperatura
  inventada. Temperatura externa vem na mesma resposta e pode vir vazia sem
  falhar a série interna.
- **Rationale**: A spec pede a contagem na linha, a escolha do balde e a
  lacuna. Clima ausente era o ponto de baixo impacto deixado no clarify.
- **Alternatives considered**: Calcular a contagem varrendo
  `telemetry_samples` foi rejeitado. Estoura a meta de 30 ms.

## 8. Acesso

- **Decision**: Personas `network_manager`, `store_manager` e
  `diel_operator`. JWT com o perfil. O foco do operador fica no Redis, não
  no token, e a API exige foco antes de listar loja ou lote. Gerente fica
  em `allowed_store_ids`. Lote original: operador focado e gestor do
  cliente. Gerente recebe `FORBIDDEN`.
- **Rationale**: Fecha as três respostas do clarify sem colocar o cliente
  em foco dentro de um token que a tela pudesse reescrever.
- **Alternatives considered**: Um JWT novo a cada troca de cliente foi
  rejeitado. A tela passaria a ser parte da autorização.

## 9. Testes e migrations

- **Decision**: Jest nos containers do worker e da API para unidade.
  E2E sobe o Compose, publica MQTT e chama a API. Migrations são SQL em
  `db/migrations`, aplicadas na subida, cada arquivo até 300 linhas.
  Repositories usam `pg` e devolvem model. Sem ORM.
- **Rationale**: Timescale exige SQL explícito. A constituição exige
  repository, migration e as duas suítes no Docker.
- **Alternatives considered**: ORM genérico foi rejeitado. Continuous
  aggregate e compressão não cabem nele sem SQL cru espalhado.

## 10. Idioma e segredos

- **Decision**: Campos e códigos de erro em inglês (`IN_RANGE`,
  `FORBIDDEN`). O frontend traduz para português. Segredos só por ambiente.
  `.env.example` na raiz lista toda variável com placeholder.
- **Rationale**: Princípios VI, XIII e XIV.
- **Alternatives considered**: Mensagem pronta em português na API foi
  rejeitada. O código de erro deixaria de ser estável.
