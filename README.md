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

O relógio é o instante da amostra mais nova. Ele fica numa linha do Postgres, gravada junto com as amostras, e na chave `system:virtual_now` para a tela não ir ao banco toda vez. Se a chave some, ela se refaz com essa linha. O arquivo termina em fevereiro de 2026, então status e períodos usam esse instante, e não o horário da máquina. O worker só avança o relógio. Pacote atrasado fica no passado dele. O "Agora" do cabeçalho é esse valor, em horário de Brasília. Online é visto nos últimos 15 minutos dele.

O ao vivo é um aviso no canal `live:{cliente}`, no máximo um por segundo por ambiente, com temperatura, conforto e status. A API entrega isso no WebSocket `/live` para quem está com a tela daquele cliente aberta. O aviso some se ninguém estiver ouvindo. O que fica guardado é a linha no TimescaleDB.

A ingestão e a tela são caminhos separados. O simulador publica no EMQX em QoS 1. A assinatura `$share/ingestion/diel/telemetry` entrega cada pacote a um worker, que grava a linha na stream e confirma o MQTT. A réplica entra nesse grupo. Fora dele, o broker entrega o pacote a cada processo. Os mesmos workers leem essa stream em lotes de até 2.000, cada um com o próprio nome. Dentro do processo, quatro faixas pelo hash do dispositivo tratam aparelhos diferentes ao mesmo tempo. O instante da amostra define a linha, então a ordem de chegada entre workers não muda a série. O lote vira um objeto novo no MinIO, em `dt=AAAA-MM-DD/hour=HH/client=ID/{id}.jsonl.gz`, e um `INSERT` por faixa no TimescaleDB. A API fica fora desse caminho.

A web chama a API. A lista junta loja, expediente, faixa e temperatura no TimescaleDB, no mesmo Postgres do cadastro. De 1 hora para cima o gráfico lê a agregação horária. 30 minutos leem a amostra, com gapfill. O cabeçalho, o status e o período leem o relógio no Redis.

## Tecnologias

### Postgres e TimescaleDB

Cadastro e série ficam no mesmo banco. A lista junta loja, expediente, faixa e temperatura numa consulta SQL. O Timescale entra por causa da série: hypertable por tempo, agregação horária contínua e gapfill no gráfico. A agregação horária refresca a série guardada, do primeiro ao último instante, e não os últimos 30 dias do relógio da máquina.

Prós: uma consulta só, com o cadastro do lado da amostra, e a janela longa no agregado.

Contras: gravar telemetria e abrir a lista usam o mesmo Postgres. Se a escrita aperta, a tela sente. O gráfico de 1 hora ou mais lê o resumo já calculado. O de 30 minutos lê as amostras, porque a ficha de uma hora não se parte ao meio.

### SQL direto, sem ORM

O acesso ao banco é o driver `pg`. O repository escreve a query e devolve o model. A migration é um arquivo SQL em `db/migrations`.

O Timescale pede esse SQL: hypertable, agregação contínua, compressão e `time_bucket_gapfill`. Um ORM genérico não descreve isso. O que sobra vira SQL cru ao lado do mapeamento.

O cadastro fica no mesmo caminho. Cliente, loja, usuário e ambiente moram no mesmo Postgres da série. A lista junta os dois numa consulta: filtro, ordenação, paginação e o estado `last_*` do ambiente. A gravação do lote faz o inverso na mesma transação: amostra, anomalia, lote cru e o `UPDATE` de `environments.last_*`. Um ORM só para o cadastro cobriria o login e poucas leituras. A consulta com meta de tempo e a transação do lote continuariam escritas à mão, e o schema continuaria na migration, porque a hypertable e a agregação contínua nascem ali.

Prós: uma forma de ler e gravar. A consulta da lista fica visível. A transação do lote usa um cliente só.

Contras: cada query nova é SQL, e a linha vira model na mão.

### Redis

A fila, o cache do relógio e o aviso ao vivo são três usos de naturezas diferentes, e os três cabem num processo que a ingestão já atravessa. A stream segura o pacote até o lote ser gravado. A chave `system:virtual_now` evita uma ida ao banco em toda página. O canal `live:{cliente}` empurra a leitura para quem está com a tela aberta.

Prós: o MQTT confirma na entrada da fila, antes do `INSERT`, e os dois workers consomem o mesmo grupo. A tela lê o relógio sem ir ao banco.

Contras: a stream é uma só, e a ingestão cresce até ela encher.

### MinIO

O cru é arquivo imutável, no formato de objeto do S3. O MinIO é essa API, para o exemplo rodar sem uma conta na nuvem. Em produção o cru chega a 20 GB por dia. Ele vai para o objeto, um arquivo novo por lote, porque a tela não lê esse volume. A série tratada fica na hypertable e o gráfico longo lê o resumo horário. Cada lote fica em `dt=AAAA-MM-DD/hour=HH/client=ID/{id}.jsonl.gz`, e não é reescrito.

Prós: o JSON cru fica fora da tabela que a tela lê, e o objeto não é reescrito.

Contras: o objeto é um arquivo compactado, sem índice por ambiente e intervalo. O gráfico precisaria abrir os lotes e filtrar na mão. A série no Timescale já responde isso. O pacote original continua no objeto, para auditoria e para rodar de novo.

### EMQX

O dispositivo fala MQTT. O EMQX é o broker, com QoS 1 e grupo `$share/ingestion`. Cada pacote entra numa réplica só. A réplica entra nesse grupo. Fora dele, cada processo recebe todos os pacotes.

Prós: a ingestão cresce com outra imagem igual, e a API fica fora desse caminho.

Contras: o broker reparte por mensagem, sem olhar qual worker está ocupado.

### API e web

A API é NestJS e a web é Next.js. A ingestão fica noutro processo, então um pico de pacote atrasado não segura a lista. A API expõe o OpenAPI. A web lê essa API e o WebSocket `/live`.

Prós: o worker escala pela entrada e a API pela consulta.

Contras: sobe mais um serviço, e a tela depende da API estar no ar.

## Decisões

Cliente, loja, ambiente, dispositivo e usuário ficam no cadastro. A loja guarda cidade, coordenadas, fuso e expediente. O ambiente guarda a faixa de conforto e o expediente, e um dispositivo aponta para ele. A amostra tratada é a hypertable `telemetry_samples`, única por ambiente e instante. Leitura rejeitada vai para `telemetry_anomalies`. A temperatura externa da cidade fica em `external_weather`, uma linha por loja e hora.

O usuário tem perfil. O operador da Diel escolhe um cliente por vez. O gestor vê o cliente dele. O gerente vê as lojas da lista dele.

Online, offline e sem dados usam o "agora" da amostra mais nova. Visto nos últimos 15 minutos, visto antes disso, ou nunca visto.

Uma passagem no arquivo contou `saved_data`, leitura fora de −10 °C a 60 °C, o par dispositivo + timestamp repetido e o dispositivo que não está no cadastro. São 180.951 pacotes. Quatro casos saem do caminho normal:

- 247 chegaram atrasados (`saved_data`). A amostra entra no instante calculado. O relógio segue no pacote mais novo.
- 220 trazem ao menos uma leitura fora de −10 °C a 60 °C. A leitura vira anomalia e fica fora da série.
- Cerca de 1.100 linhas repetem o mesmo dispositivo no mesmo timestamp. A chave única de ambiente e instante guarda uma amostra e uma anomalia, também quando o arquivo roda de novo.
- 481 pacotes são do IOT099, que não está no cadastro. A leitura vira anomalia e fica fora da série.

O conforto do período é a fração do expediente em que a temperatura ficou na faixa, no fuso da loja. Cada amostra na faixa cobre 30 segundos, o intervalo do arquivo. Expediente sem leitura pesa no denominador, e o gráfico mostra essa lacuna.

A API documentada entrega a lista de lojas e de ambientes, o resumo de um ambiente e a série num intervalo. A visão da rede tem último dia, última semana e 30 dias, contados a partir do "agora". Pagina, filtra por cliente, loja, ambiente, faixa e status do dispositivo, e ordena. A lista traz o resumo. O detalhe abre a série, a faixa de conforto e a temperatura externa da Open-Meteo. Janelas de 1 hora ou mais leem a agregação horária.

A observabilidade sobe com a stack. O Prometheus lê `/metrics`. O Promtail manda o log dos containers ao Loki. O Grafana abre com as três fontes e o painel Ingestão, em http://localhost:3003. A senha inicial é a de `GRAFANA_ADMIN_PASSWORD`, `change-me` no exemplo.
