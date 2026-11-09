# Data model: Interface operacional Celsius 360

Não há tabela nova nem migration. A história lê cadastro que já existe e
acrescenta campos de leitura.

## Sessão visível

Leitura de `users`, `clients` e do foco do operador.

| Campo | Origem | Regra |
|-------|--------|--------|
| profile | usuário autenticado | `network_manager`, `store_manager` ou `diel_operator` |
| clientId | cliente do usuário, ou foco do operador | nulo só no operador sem foco |
| clientName | `clients.name` | nulo quando `clientId` é nulo |

Sem token válido, não há sessão. Gestor e gerente não escolhem outro cliente.

## Loja na visão da rede

Mesma linha que a listagem já devolve: `id`, `name`, `city`, `uf`,
`inRangeCount`, `aboveCount`, `belowCount`, `noDataCount`, `onlineCount`,
`offlineCount`, `environments` (`id`, `name`).

Ordem da página, estável:

1. Loja com `aboveCount > 0` ou `belowCount > 0`.
2. As demais.
3. Dentro do grupo, nome da loja.

`noDataCount` não promove a loja. Página, tamanho e total continuam os da
listagem. Tamanho padrão 50, máximo 100.

## Resumo do ambiente

Campos atuais, mais:

| Campo | Origem | Regra |
|-------|--------|--------|
| storeName | `stores.name` | nome da loja do ambiente |
| timezone | `stores.timezone` | fuso IANA da loja, não do browser |

Fora do alcance continua `NOT_FOUND`, inclusive ambiente de outro cliente.

## Série

Sem campo novo. Cada ponto já tem `bucketStart` em UTC, `avgTemp`,
`minTemp`, `maxTemp` e `isOperatingHours`. Temperatura nula é lacuna. A série
`external` não altera `comfortMin` nem `comfortMax`.

A tela formata `bucketStart` com o `timezone` do resumo. Não grava esse
texto.

## Estados da tela

Não são persistidos.

| Estado | Quando | O que a pessoa vê |
|--------|--------|-------------------|
| Entrada | sem sessão | marca, Celsius 360, formulário |
| Credencial inválida | login recusado | a frase de erro e o e-mail digitado |
| Escolha de cliente | operador sem foco | o mesmo visual, seletor de cliente |
| Rede vazia | lista autorizada sem itens | "Nenhuma loja neste alcance." |
| Falha de carga | leitura não completou | "Não foi possível carregar. Tente de novo." |
| Ambiente ausente | detalhe `NOT_FOUND` | "Ambiente não encontrado." e volta à rede |
| Sessão vencida | pedido sem sessão | entrada com "Sessão encerrada. Entre de novo." |

Código de erro em inglês não é estado de tela.
