# HTTP API: delta da interface

Base, códigos e o restante do contrato continuam em
`specs/001-thermal-comfort-platform/contracts/http-api.md`. Aqui só o que
esta história muda. Campo e código seguem em inglês. A frase em português
fica na tela.

## GET /auth/session

Exige sessão. Sem sessão: `UNAUTHENTICATED`.

Saída: `profile`, `clientId`, `clientName`.

Gestor e gerente recebem o próprio cliente. Operador recebe o cliente em
foco, ou `clientId` e `clientName` nulos quando ainda não escolheu. Não
devolve token, e-mail nem senha.

## POST /auth/login e POST /auth/focus-client

Sem mudança de corpo. Sair da tela não chama a API: a sessão do browser é
apagada. O foco do operador permanece guardado para a próxima entrada.

## GET /stores

Corpo atual, inclusive `page`, `pageSize`, `total` e `items`.

A ordem de `items` passa a ser: loja com `aboveCount` ou `belowCount` maior
que zero primeiro; em seguida as outras; desempate pelo nome. A ordem vale
antes da página. `noDataCount` não entra no critério.

## GET /environments/:id/summary

Campos atuais, mais `storeName` e `timezone`. `timezone` é o fuso da loja.

Fora do alcance: `NOT_FOUND`.

## GET /environments/:id/timeseries

Sem campo novo. A tela usa `timezone` do resumo para formatar `bucketStart`.
Lacuna continua temperatura nula. `external` continua fora da faixa de
conforto.
