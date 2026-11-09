# Data Model: Celsius 360 Lite

Os nomes de campo abaixo são o contrato lógico. A migration física segue
`docs/celsius-360/04-modelagem.md` e as regras desta página. Instante
persistido é UTC.

## Client

Rede atendida. Campos: `id`, `name`, `segment`. Não se apaga em cascata
enquanto houver loja.

## Store

Unidade de um cliente. Campos: `id`, `clientId`, `name`, `type`, `city`,
`uf`, `latitude`, `longitude`, `timezone`, `operatingHours`. `uf` tem 2
letras. `timezone` é um fuso IANA. `operatingHours` é a agenda de
referência. A regra de conforto do ambiente usa a agenda do próprio
ambiente, não a da loja.

## Environment

Cômodo de uma loja, um dispositivo. Campos: `id`, `storeId`, `name`,
`comfortMin`, `comfortMax`, `operatingHours`, `deviceId` único, `lastSeenAt`,
`lastTemp`, `lastComfortStatus`, `isCurrentlyOperating`.

`comfortMin` é menor ou igual a `comfortMax`. `lastComfortStatus` é
`IN_RANGE`, `ABOVE` ou `BELOW`, ou nulo se não houve leitura aceita.
`lastSeenAt` nulo significa `NO_DATA`.

Presença, contra `system:virtual_now`:

- `NO_DATA` quando `lastSeenAt` é nulo
- `ONLINE` quando a diferença é de até 15 minutos
- `OFFLINE` quando a diferença passa de 15 minutos

A contagem da loja soma os ambientes. `noDataCount` usa só `NO_DATA`.
`inRangeCount`, `aboveCount` e `belowCount` usam o último conforto dos
demais. As quatro somam o total de ambientes.

## User

Pessoa que entra com e-mail e senha. Campos: `id`, `name`, `email` único,
`passwordHash`, `profile`, `clientId`, `allowedStoreIds`.

`profile` é `network_manager`, `store_manager` ou `diel_operator`. Gestor e
gerente exigem `clientId`. O gerente exige lista de lojas desse cliente. O
operador tem `clientId` nulo e lista vazia. O foco não é coluna: fica no
Redis, chave por sessão, valor um `clientId`. Sem foco, loja e lote voltam
vazios.

## TelemetrySample

Série tratada. Chave única `(environmentId, sampleTime)`. Campos também:
`storeId`, `deviceId`, `temperature`, `isOperatingHours`, `comfortStatus`,
`isDelayedPacket`, `rawBatchKey`.

Temperatura aceita vai de −10 a 60, inclusive. `comfortStatus` compara com
a faixa do ambiente. `isOperatingHours` usa o fuso da loja e a agenda do
ambiente. Reenvio do mesmo pacote atualiza a linha com os mesmos valores.

## HourlyComfortSummary

Continuous aggregate por hora, loja e ambiente. Contagens de amostras no
expediente, dentro, acima e abaixo, mais média, mínima, máxima e amostras
atrasadas. A listagem da rede não depende desta view. Ela serve o período.
Pacote atrasado entra na hora histórica e a view passa a incluí-lo.

## TelemetryAnomaly

Leitura rejeitada. Campos: `detectedAt`, `deviceId`, `environmentId`,
`rawValue`, `reason`, `rawBatchKey`. `reason` da v1 é `OUT_OF_RANGE`. Não
entra em `TelemetrySample` nem no conforto.

## RawBatch

Objeto `.jsonl.gz` no bucket `diel-raw-telemetry`. Chave lógica: data, hora
e hash dos pacotes do lote. Metadado mínimo para a API listar por dia e
cliente: `batchKey`, `clientId`, `recordedAt`, `packetCount`. A listagem não
devolve o corpo. O gráfico não lê o objeto.

## ExternalWeather

Temperatura da cidade de uma loja num instante. Chave única `(storeId,
readingTime)`. Ausência não falha o detalhe: a série externa vem vazia.

## VirtualClock

Chave Redis `system:virtual_now`. Sobe para o maior `sampleTime` confirmado
no TimescaleDB. Nunca anda para trás.

## OperatingHours

Agenda semanal. Cada dia (`mon` … `sun`) tem zero ou mais pares
`start`/`end` no horário local `HH:mm`. Se `end` é menor ou igual a
`start`, o intervalo cruza a meia-noite. Não há feriado na v1.

## Transições de presença

`NO_DATA` passa a `ONLINE` na primeira leitura aceita. `ONLINE` passa a
`OFFLINE` quando o relógio virtual se afasta mais de 15 minutos.
`OFFLINE` volta a `ONLINE` com leitura nova. Nenhuma leitura rejeitada muda
`lastSeenAt`.
