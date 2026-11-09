# HTTP API

Base `/api/v1`. Campo e código de erro em inglês. A frase em português fica
no frontend. Resposta de erro: `{ "code": "<CODE>" }`.

Códigos: `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `FORBIDDEN`,
`CLIENT_FOCUS_REQUIRED`, `NOT_FOUND`, `INVALID_RANGE`, `INVALID_BUCKET`.

Quem chama: gestor (`network_manager`), gerente (`store_manager`) e
operador (`diel_operator`). O escopo é aplicado no servidor.

## POST /auth/login

Entrada: `email`, `password`. Saída: `accessToken`, `profile`, `clientId`
nulo para o operador. Credencial inválida: `INVALID_CREDENTIALS`, sem
sessão.

## POST /auth/focus-client

Só o operador. Entrada: `clientId`. Sem esse foco, loja e lote ficam vazios
com `CLIENT_FOCUS_REQUIRED` no corpo vazio de lista, não como erro de
transporte. Gestor ou gerente que chamam este caminho recebem `FORBIDDEN`.

## GET /stores

Paginada. Query: `page` (padrão 1), `pageSize` (padrão 50, máximo 100).

Cada item: `id`, `name`, `city`, `uf`, `inRangeCount`, `aboveCount`,
`belowCount`, `noDataCount`, `onlineCount`, `offlineCount`. As quatro
contagens de conforto somam os ambientes da loja. `noDataCount` conta só
quem nunca leu. Presença usa o relógio virtual.

Gestor vê o próprio cliente. Gerente vê a interseção com
`allowedStoreIds`. Operador vê o cliente em foco. Outro cliente não aparece.

## GET /environments/:id/summary

`name`, `comfortMin`, `comfortMax`, `lastTemp`, `lastComfortStatus`,
`deviceStatus` (`ONLINE`, `OFFLINE`, `NO_DATA`), `isCurrentlyOperating`,
`comfortPercent`. O percentual é amostras `IN_RANGE` no expediente dividido
pelas amostras no expediente, no recorte pedido. Sem amostra no expediente,
o percentual vem nulo, não zero fingido.

Fora do escopo: `NOT_FOUND`. O recurso de outro cliente também é
`NOT_FOUND`, para não revelar que ele existe.

## GET /environments/:id/timeseries

Query: `from`, `to`, `bucket`. `bucket` é `15m`, `30m` ou `1h`. Ausente,
vale `30m`. Janela maior que 30 dias: `INVALID_RANGE`. Outro balde:
`INVALID_BUCKET`.

Cada ponto: `bucketStart`, `avgTemp`, `minTemp`, `maxTemp`,
`isOperatingHours`. Balde sem leitura: temperaturas nulas. A série
`external`: `bucketStart`, `avgTemp`, possivelmente vazia. Ela não altera
`comfortMin` nem `comfortMax`, que vêm no topo da resposta.

## GET /storage/raw-batches

Query: `date` (`YYYY-MM-DD`). Itens: `batchKey`, `recordedAt`,
`packetCount`. Sem o corpo do objeto.

Operador no cliente em foco e gestor no próprio cliente. Gerente:
`FORBIDDEN`. Operador sem foco: lista vazia e `CLIENT_FOCUS_REQUIRED`.
Data de outro cliente não vaza chave.
