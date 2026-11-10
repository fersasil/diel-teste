# Celsius 360

Versão reduzida da plataforma de conforto térmico da Diel Energia. Recebe a telemetria dos dispositivos, guarda o cru, calcula o estado da rede e mostra isso na web.

## Como rodar

Requisitos: Docker e Docker Compose.

```sh
docker compose up -d --build
```

A primeira subida aplica as migrations e o cadastro de exemplo. A senha de todos os usuários de exemplo é `change-me`. Ela não fica gravada no banco: o seed guarda só o hash.

O simulador publica os 180.951 pacotes, um a um. A web abre antes do fim. Acompanhe com:

```sh
docker compose logs -f simulator
```

A linha `published 180951` encerra a carga. Até a primeira telemetria, o cabeçalho diz "Aguardando a primeira telemetria". Depois mostra o "agora", que é o instante da amostra mais nova.

| Serviço | Endereço |
| --- | --- |
| Web | http://localhost:3001 |
| API | http://localhost:3000/api/v1 |
| OpenAPI | http://localhost:3000/openapi.json |
| Grafana | http://localhost:3003 |

Usuários de exemplo:

| E-mail | Perfil |
| --- | --- |
| ana.ribeiro@diel.example | Operador Diel. Escolhe o cliente antes de ver a rede. |
| carlos.mendes@modacarioca.example | Gestor da Moda Carioca. |
| juliana.prado@modacarioca.example | Gerente da Loja Paulista. |
| roberto.lima@bancohorizonte.example | Gestor do Banco Horizonte. |

Para reprocessar o arquivo na ordem de chegada, com o stack no ar:

```sh
docker compose run --rm -e TELEMETRY_FILE=/repo/data/telemetrias.jsonl ingestion-worker node dist/replay-file.js
```

O diretório `data/` entra no worker pelo volume. O comando imprime `replayed` a cada lote de 2.000 linhas. O simulador, na subida, imprime `published` a cada mil pacotes.

Testes:

```sh
docker compose --profile test run --rm unit-tests
docker compose --profile test run --rm e2e-tests
```

## Arquitetura

```mermaid
flowchart TB
  sim[Simulador] -->|MQTT QoS 1| emqx[EMQX]
  emqx -->|cada pacote para um| w1[Worker 1]
  emqx -->|cada pacote para um| w2[Worker 2]
  w1 -->|enfileira| fila[("Redis Stream<br/>a fila")]
  w2 -->|enfileira| fila
  fila -->|lote de até 2.000| consome["os mesmos workers<br/>consomem a fila"]
  consome --> minio[("MinIO (S3)<br/>pacote cru")]
  consome --> db[("TimescaleDB<br/>cadastro e série")]
```

O pacote só chega no MinIO e no TimescaleDB depois de passar pela stream.

```mermaid
flowchart LR
  web[Next.js] --> api[API]
  api -->|consulta| db[("TimescaleDB")]
  api -->|relógio e ao vivo| vivo[("Redis")]
```

A seta "consulta" lê a série. A seta "relógio e ao vivo" é o mesmo Redis da fila, em outro papel.

O relógio é a chave `system:virtual_now`, o instante da amostra mais nova já gravada. O arquivo termina em fevereiro de 2026, então status e períodos usam esse instante, e não o horário da máquina. O worker só avança a chave. Pacote atrasado fica no passado dele. O "Agora" do cabeçalho é esse valor, em horário de Brasília. Online é visto nos últimos 15 minutos dele.

O ao vivo é um aviso no canal `live:{cliente}`, no máximo um por segundo por ambiente, com temperatura, conforto e status. A API entrega isso no WebSocket `/live` para quem está com a tela daquele cliente aberta. O aviso some se ninguém estiver ouvindo. O que fica guardado é a linha no TimescaleDB.

A ingestão e a tela são caminhos separados. O simulador publica no EMQX em QoS 1. A assinatura `$share/ingestion/diel/telemetry` entrega cada pacote a um worker, que grava a linha na stream e confirma o MQTT. A réplica entra nesse grupo. Fora dele, o broker entrega o pacote a cada processo. Os mesmos workers leem essa stream em lotes de até 2.000, cada um com o próprio nome. Dentro do processo, quatro faixas pelo hash do dispositivo mantêm a ordem dele. O lote vira um objeto novo no MinIO, em `dt=AAAA-MM-DD/hour=HH/client=ID/{id}.jsonl.gz`, e um `INSERT` por faixa no TimescaleDB. A API fica fora desse caminho.

A web chama a API. A lista junta loja, expediente, faixa e temperatura no TimescaleDB, no mesmo Postgres do cadastro. De 1 hora para cima o gráfico lê a agregação horária. 15 e 30 minutos leem a amostra, com gapfill. O cabeçalho, o status e o período leem o relógio no Redis.

### Prós

- O pico de gravação fica no worker. Pacote atrasado espera na fila, e a API continua respondendo a lista.
- O MQTT é confirmado na entrada da stream, antes do `INSERT`. O broker não espera o banco.
- Outra réplica da mesma imagem, no grupo `$share/ingestion`, aumenta a ingestão. Cada pacote entra uma vez.
- Cadastro e série no mesmo banco deixam a rede numa consulta.
- O cru fica imutável no MinIO, um armazenamento compatível com S3, fora da tabela que a tela lê.

### Contras

- O teto é um Postgres e uma stream. Mais workers não aliviam esses dois, e o cadastro divide o pico da série.
- Dois pacotes do mesmo dispositivo podem cair em workers diferentes e ser gravados fora da ordem de chegada. Cada um entra no próprio instante. No mesmo instante, fica uma linha. O relógio só avança.
- Relógio e ao vivo moram no Redis. Perder o Redis refaz o "agora" com os pacotes seguintes. O aviso some se ninguém está ouvindo.

## Decisões

Cliente, loja, ambiente, dispositivo e usuário ficam no cadastro. A loja guarda cidade, coordenadas, fuso e expediente. O ambiente guarda a faixa de conforto e o expediente, e um dispositivo aponta para ele. A amostra tratada é a hypertable `telemetry_samples`, única por ambiente e instante. Leitura rejeitada vai para `telemetry_anomalies`. A temperatura externa da cidade fica em `external_weather`, uma linha por loja e hora.

O usuário tem perfil. O operador da Diel escolhe um cliente por vez. O gestor vê o cliente dele. O gerente vê as lojas da lista dele.

Online, offline e sem dados usam o "agora" da amostra mais nova. Visto nos últimos 15 minutos, visto antes disso, ou nunca visto.

Uma passagem no arquivo contou `saved_data`, leitura fora de −10 °C a 60 °C e o par dispositivo + timestamp repetido. São 180.951 pacotes. Três casos saem do caminho normal:

- 247 chegaram atrasados (`saved_data`). A amostra entra no instante calculado. O relógio segue no pacote mais novo.
- 220 trazem ao menos uma leitura fora de −10 °C a 60 °C. A leitura vira anomalia e fica fora da série.
- Cerca de 1.100 linhas repetem o mesmo dispositivo no mesmo timestamp. A chave única de ambiente e instante guarda uma amostra e uma anomalia, também quando o arquivo roda de novo.

O conforto do período é a fração do expediente em que a temperatura ficou na faixa, no fuso da loja. Cada amostra na faixa cobre 30 segundos, o intervalo do arquivo. Expediente sem leitura pesa no denominador, e o gráfico mostra essa lacuna.

A API documentada entrega a lista de lojas e de ambientes, o resumo de um ambiente e a série num intervalo. A visão da rede tem último dia, última semana e 30 dias, contados a partir do "agora". Pagina, filtra por cliente, loja, ambiente, faixa e status do dispositivo, e ordena. A lista traz o resumo. O detalhe abre a série, a faixa de conforto e a temperatura externa da Open-Meteo. Janelas de 1 hora ou mais leem a agregação horária.

A observabilidade sobe com a stack. O Prometheus lê `/metrics`. O Promtail manda o log dos containers ao Loki. O Grafana abre com as três fontes e o painel Ingestão, em http://localhost:3003. A senha inicial é a de `GRAFANA_ADMIN_PASSWORD`, `change-me` no exemplo.
