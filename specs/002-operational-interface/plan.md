# Implementation Plan: Interface operacional Celsius 360

**Branch**: `002-operational-interface` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-operational-interface/spec.md`

## Summary

As quatro telas atuais passam a seguir a marca pública da Diel e a mostrar a
exceção da rede antes do resto. O detalhe vira gráfico com faixa, lacuna e
temperatura externa. A barra diz quem entrou e oferece sair.

A API só acrescenta a sessão visível, o nome e o fuso da loja no resumo, e a
ordem da listagem. Conforto, expediente e status continuam calculados no
backend. O desenho está em [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/) e
[quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript no Node.js 22. Frontend Next.js. API NestJS
com Fastify, já existente.

**Primary Dependencies**: Nenhuma biblioteca nova no produto. Gráfico em SVG.
Fonte Inter em arquivo local. Playwright só na imagem de teste de tela.

**Storage**: Sem migration. Lê `clients.name` e `stores.timezone`, que já
existem. Foco do operador continua no Redis.

**Testing**: Unitário de contraste, formatação e sessão no `unit-tests`.
E2E pede o HTML do frontend. Largura e teclado no serviço `ui-tests`.

**Target Platform**: Stack Docker Compose local. Telas no navegador, cerca de
1280 px e cerca de 390 px.

**Project Type**: Web. Mudança no frontend e um acréscimo de leitura na API.

**Performance Goals**: Não muda as metas de 30 ms e 100 ms da plataforma. A
tela não pede a série inteira sem paginação nem reordena a lista no browser.

**Constraints**: Arquivo de aplicação, teste e migration até 300 linhas. Um
service, um caso de uso. Texto de tela em português. Código em inglês. A
tela não recalcula conforto, expediente nem autorização. Horário exibido no
fuso da loja. Variável nova no `.env.example`.

**Scale/Scope**: Quatro rotas já existentes. Três perfis. Página de 50 lojas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano cumpre | Resultado |
|-----------|---------------------|-----------|
| I. Testes na stack Docker | Unitário nos dois workspaces. E2E inclui o frontend. Largura no `ui-tests`. Ver [quickstart.md](./quickstart.md). | Pass |
| II. Isolamento da ingestão | Esta história não mexe no worker nem no MQTT. | Pass |
| III. Lago desacoplado | A tela continua lendo a API. Não abre o MinIO. | Pass |
| IV. Node orquestra | Frontend permanece Next.js. Sem runtime novo no produto. | Pass |
| V. RBAC e observabilidade | Sessão e listagem seguem o escopo do servidor. Sem métrica nova: a mudança não altera ingestão nem latência da API. | Pass |
| VI. Idioma | Frases em português na tela. Campos novos da API em inglês. | Pass |
| VII. Tamanho | CSS, gráfico e serviços partidos para caber em 300 linhas. Sessão é um caso de uso. | Pass |
| VIII. Persistência | Sem schema novo. `storeName` e `timezone` saem por repository. | Pass |
| IX. ACK após durabilidade | Não altera o worker. | Pass |
| X. Idempotência | Não altera a gravação. | Pass |
| XI. Regra no backend | A tela formata número e horário. Não recalcula faixa, expediente nem quem pode ver. A ordem da rede vem do SQL. | Pass |
| XII. UTC e fuso | `bucketStart` segue UTC. O eixo usa `timezone` da loja devolvido pela API. | Pass |
| XIII. Segredos | Logotipo e cor são públicos. Nenhum segredo novo. | Pass |
| XIV. `.env.example` | `WEB_BASE_URL` entra no exemplo porque o e2e e o `ui-tests` leem essa variável. | Pass |

Nenhuma violação. A tabela de complexidade fica vazia.

## Project Structure

### Documentation (this feature)

```text
specs/002-operational-interface/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-api.md
│   └── screens.md
├── spec.md
└── tasks.md              # fase seguinte, não criada aqui
```

### Source Code (repository root)

```text
apps/api-server/src/
├── http/auth.controller.ts          # ganha GET /auth/session
├── services/read-session.service.ts # um caso de uso
└── repositories/                    # nome do cliente, loja e fuso; ordem da lista
apps/web/src/
├── brand/                           # tokens, contraste, fonte, logotipo
├── messages/pt-BR.ts
├── app/entrar/
├── app/rede/
├── app/ambientes/[id]/
└── components/                      # barra, bloco da loja, gráfico
apps/web/public/brand/               # SVG copiado do site público
docker-compose.yml                   # unit-tests roda web; serviço ui-tests
.env.example                         # WEB_BASE_URL
```

**Structure Decision**: A interface mora em `apps/web`. A API só expõe o que
a barra e o eixo não podem inventar: perfil, nome do cliente, nome da loja,
fuso e a ordem da página. O worker e o simulador não entram.

## Post-Design Constitution Check

Revisto depois de `research.md`, `data-model.md`, `contracts/` e
`quickstart.md`. O contrato HTTP não muda conforto nem autorização. O gráfico
consome a série já agregada e não lê o object storage. O serviço de teste de
tela fica no perfil `test` e não é runtime do produto. `WEB_BASE_URL` é a
única variável nova. O gate permanece aprovado, sem violação nova.

## Complexity Tracking

Nenhuma violação da constituição precisa de justificativa.
