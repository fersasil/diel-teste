# WebSocket

Canal autenticado no `api-server`. O browser não calcula conforto. Cada
evento repete o estado que a API já gravou.

## Conexão

O cliente envia o mesmo token do HTTP. Token inválido fecha a conexão.
Gestor entra no canal do próprio cliente. Gerente entra só nas lojas
permitidas. Operador entra no canal do cliente em foco. Troca de foco
troca o canal e não mantém o cliente anterior.

## Evento `environment.updated`

Emitido depois que uma leitura foi aceita e o estado do ambiente foi
atualizado. Campos: `environmentId`, `storeId`, `lastTemp`,
`lastComfortStatus`, `deviceStatus`, `isCurrentlyOperating`, `virtualNow`.

A visão da rede soma de novo as contagens daquela loja com este evento,
sem pedir a série e sem abrir o arquivo cru. O detalhe aberto substitui o
último ponto se ele cair no balde visível. Lacuna continua lacuna.

## O que não trafega

Senha, token, e-mail e corpo do lote cru não entram no evento nem no log
desse canal.
