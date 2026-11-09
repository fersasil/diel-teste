# Tasks: Interface operacional Celsius 360

**Input**: Design documents from `/specs/002-operational-interface/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos. A constituição (princípio I) exige suíte unitária e suíte e2e no Docker Compose. Escreva o teste, veja falhar, depois implemente.

**Organization**: Uma fase por história, para implementar e testar cada uma sem depender das outras.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem depender de tarefa incompleta)
- **[Story]**: História da spec (`US1` … `US5`)
- Setup, fundação e polimento não levam história

## Path Conventions

- `apps/api-server/src/`, `apps/web/src/`
- Teste unitário ao lado do código (`*.test.ts`)
- E2E de API em `apps/api-server/test/e2e/`
- E2E de HTML em `apps/web/test/e2e/`
- Largura e teclado em `apps/web/test/ui/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ferramenta de teste do frontend, marca em arquivo local e a variável que o e2e vai ler

- [X] T001 Acrescentar `WEB_BASE_URL=http://web:3001` em `.env.example`, só com placeholder
- [X] T002 [P] Acrescentar Jest 30, `test` (`--testPathPatterns=src`) e `test:e2e` (`--testPathPatterns=test/e2e`) em `apps/web/package.json` e criar `apps/web/jest.config.js` no mesmo padrão do api-server
- [X] T003 [P] Copiar `https://dielenergia.com/assets/img/logo-diel-energia-header.svg` para `apps/web/public/brand/logo-diel-energia-header.svg` e gravar Inter 400 (OFL) e `https://dielenergia.com/assets/fonts/inter-700-normal-latin.woff2` em `apps/web/src/brand/fonts/`. Sem hotlink
- [X] T004 Fazer o serviço `unit-tests` de `docker-compose.yml` rodar `npm test` de `api-server` e de `web`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, frase compartilhada e o corredor de e2e do frontend. Nenhuma história começa antes disto.

**⚠️ CRITICAL**: Nenhuma história começa antes do fim desta fase.

- [X] T005 [P] Teste unitário em `apps/web/src/brand/tokens.test.ts`. `#0F172A` sobre `#FFFFFF` e `#FFFFFF` sobre `#2547D0` medem pelo menos 4,5 para 1. `#FFFFFF` sobre `#00A3FF` fica abaixo de 4,5 e não pode ser par de texto
- [X] T006 Implementar `apps/web/src/brand/tokens.ts` com texto `#0F172A`, fundo `#FFFFFF`, divisória `#E2E8F0`, botão `#2547D0`, acento `#00A3FF` e marcas `#39B719`, `#F93A3A`, `#00A3FF`, `#CBD5E1`. A marca não é cor de texto
- [X] T007 [P] Acrescentar em `apps/web/src/messages/pt-BR.ts` as frases de `contracts/screens.md` sem apagar as atuais: Operador Diel, Gestor de rede, Gerente de loja, Sair, Trocar cliente, Voltar, Temperatura externa, Faixa de conforto, "Não foi possível carregar. Tente de novo.", "Ambiente não encontrado.", "Sessão encerrada. Entre de novo."
- [X] T008 Criar `apps/web/src/app/base.css` com Inter local, espaçamento, foco visível `#2547D0` e os tokens de T006, e importar em `apps/web/src/app/layout.tsx`. O arquivo fica com até 300 linhas
- [X] T009 [P] Em `apps/web/src/components/device-status.tsx`, manter a palavra em português e acrescentar a marca visual. A cor do texto continua `#0F172A`
- [X] T010 Em `docker-compose.yml`, o serviço `e2e-tests` depende de `web`, recebe `WEB_BASE_URL` e, depois do e2e do api-server, instala e roda `npm run test:e2e --workspace web`

**Checkpoint**: Marca e mensagens prontas. História pode começar em paralelo.

---

## Phase 3: User Story 1 - Enxergar a exceção na rede (Priority: P1) 🎯 MVP

**Goal**: Cada loja é um bloco. Quem está acima ou abaixo da faixa aparece antes. Dá para ir à página seguinte.

**Independent Test**: Com uma loja fora da faixa e outra dentro, a primeira vem na frente, com os quatro rótulos de conforto mais online e offline.

### Tests for User Story 1

- [X] T011 [P] [US1] E2E em `apps/api-server/test/e2e/store-order.e2e.ts`. Com `API_BASE_URL`, a primeira loja de Carlos tem `aboveCount` ou `belowCount` maior que zero quando alguma loja do alcance está assim. Loja só dentro da faixa não vem antes. `noDataCount` não promove. Pular se `API_BASE_URL` estiver ausente
- [X] T012 [P] [US1] E2E em `apps/web/test/e2e/network-page.e2e.ts`. Com `WEB_BASE_URL` e sessão de Carlos, o HTML tem um bloco por loja, os rótulos Dentro da faixa, Acima, Abaixo, Sem dados, Online e Offline, e o nome do ambiente aponta para `/ambientes/{id}`. Lista vazia autorizada mostra "Nenhuma loja neste alcance."

### Implementation for User Story 1

- [X] T013 [US1] Em `apps/api-server/src/repositories/store-list.repository.ts`, ordenar antes de `LIMIT`/`OFFSET`: loja com `aboveCount > 0` ou `belowCount > 0` primeiro, depois as demais, desempate por `s.name`. Não mudar página padrão 50 nem máximo 100
- [X] T014 [P] [US1] Criar `apps/web/src/components/store-card.tsx`, um bloco por loja, só exibindo as contagens recebidas, sem reordenar
- [X] T015 [US1] Em `apps/web/src/app/rede/page.tsx`, renderizar os blocos na ordem da API, paginar com `page`, `pageSize` e `total`, esconder a página seguinte na última, e usar a query `page`. Não reordenar no browser

**Checkpoint**: A rede sozinha já mostra a exceção primeiro.

---

## Phase 4: User Story 2 - Ler o ambiente num gráfico (Priority: P1)

**Goal**: O detalhe mostra gráfico com faixa, lacuna, expediente e temperatura externa, no fuso da loja.

**Independent Test**: Abrir um ambiente com leitura, buraco e temperatura externa distingue os três, em 30 minutos, com volta à rede.

### Tests for User Story 2

- [X] T016 [P] [US2] Teste unitário em `apps/web/src/format.test.ts`. Temperatura com uma casa decimal e `°C`. Instante em `America/Sao_Paulo` não aparece com sufixo `Z`. Temperatura nula não vira número
- [X] T017 [P] [US2] Teste unitário em `apps/api-server/src/services/get-environment-summary.service.test.ts`. O resumo inclui `storeName` e `timezone` vindos da linha. Fora do alcance continua `NOT_FOUND`, também para outro cliente

### Implementation for User Story 2

- [X] T018 [P] [US2] Em `apps/api-server/src/repositories/environment.repository.ts`, o `findScoped` também lê `stores.name` e `stores.timezone`
- [X] T019 [US2] Acrescentar `storeName` e `timezone` em `apps/api-server/src/services/get-environment-summary.service.ts`. `timezone` é o fuso IANA da loja
- [X] T020 [P] [US2] Implementar `apps/web/src/format.ts` com a formatação de T016, usando o fuso recebido e não o do browser
- [X] T021 [US2] Criar o SVG em `apps/web/src/components/temperature-chart.tsx`. Média, mínima, máxima, lacuna quando a temperatura é nula, marca de expediente, faixa de conforto e série rotulada Temperatura externa. Sem biblioteca de gráfico e sem recalcular conforto. Se passar de 300 linhas, partir a geometria em `apps/web/src/components/chart-geometry.ts`
- [X] T022 [US2] Em `apps/web/src/app/ambientes/[id]/page.tsx`, mostrar nome do ambiente, nome da loja, status por extenso, faixa em °C, o fuso uma vez, Voltar para `/rede` e as opções 15 minutos, 30 minutos e 1 hora, abrindo em 30 minutos com a opção ativa marcada. O eixo usa `format.ts`

**Checkpoint**: O detalhe se abre direto, sem precisar da rede.

---

## Phase 5: User Story 3 - Entrar e saber quem está olhando (Priority: P1)

**Goal**: Entrada com a marca, barra com perfil e Sair. Operador vê o cliente em foco e pode trocar.

**Independent Test**: Senha errada mantém o e-mail e mostra o erro. Carlos chega à rede com a barra. Ana sem foco cai na escolha de cliente.

### Tests for User Story 3

- [X] T023 [P] [US3] Teste unitário em `apps/api-server/src/services/read-session.service.test.ts`. `network_manager` e `store_manager` recebem o próprio `clientId` e `clientName`. `diel_operator` sem foco recebe `clientId` e `clientName` nulos. Com foco, recebe o nome daquele cliente. A saída não tem e-mail, token nem senha
- [X] T024 [P] [US3] E2E em `apps/api-server/test/e2e/session.e2e.ts`. `GET /api/v1/auth/session` sem sessão responde `UNAUTHENTICATED`. Carlos recebe `profile` `network_manager` e o nome do cliente. Ana antes do foco recebe `clientId` nulo

### Implementation for User Story 3

- [X] T025 [P] [US3] Criar `apps/api-server/src/repositories/client.repository.ts` lendo `clients.id` e `clients.name` (`VARCHAR(100)` não nulo na tabela)
- [X] T026 [US3] Implementar o caso de uso único em `apps/api-server/src/services/read-session.service.ts` conforme `data-model.md`: `profile`, `clientId`, `clientName`
- [X] T027 [US3] Acrescentar `GET /auth/session` em `apps/api-server/src/http/auth.controller.ts`. Sem sessão: `UNAUTHENTICATED`. Não devolver token, e-mail nem senha
- [X] T028 [US3] Criar `apps/web/src/components/session-bar.tsx` e incluí-la em `apps/web/src/app/layout.tsx` quando houver sessão. Perfil só em português. Sair apaga o cookie `accessToken` e volta a `/entrar`, sem apagar o foco no Redis. Operador com cliente vê `clientName` e Trocar cliente, que volta a `/entrar/foco`
- [X] T029 [P] [US3] Aplicar logotipo e o nome Celsius 360 em `apps/web/src/app/entrar/page.tsx` e `apps/web/src/app/entrar/foco/page.tsx`. Erro de credencial mantém o e-mail e mostra "E-mail ou senha inválidos."
- [X] T030 [US3] Em `apps/web/src/app/rede/page.tsx`, operador com `clientId` nulo redireciona para `/entrar/foco`. Depende de T015 e T027

**Checkpoint**: Login, barra e sessão funcionam sem o gráfico.

---

## Phase 6: User Story 4 - Caber no notebook e no celular (Priority: P2)

**Goal**: Entrada, rede e detalhe cabem em cerca de 1280 px e cerca de 390 px, sem rolagem horizontal, e os controles funcionam por teclado.

**Independent Test**: Nos dois tamanhos, entrar, achar a loja e abrir o detalhe não rola a página para o lado.

### Tests for User Story 4

- [X] T031 [US4] Criar `apps/web/playwright.config.ts` e `apps/web/test/ui/layout.spec.ts`. Em 1280 px e 390 px, entrada, rede e detalhe têm `scrollWidth` menor ou igual à largura visível. Nome longo quebra a linha. Teclado alcança Entrar, Sair, o ambiente e o agrupamento, com foco visível

### Implementation for User Story 4

- [X] T032 [US4] Criar `apps/web/src/app/layout.css` e importar em `apps/web/src/app/layout.tsx`. Abaixo de 720 px os blocos empilham, o gráfico usa a largura do conteúdo e o nome longo quebra. Arquivo com até 300 linhas
- [X] T033 [US4] Acrescentar o serviço `ui-tests` em `docker-compose.yml`, perfil `test`, imagem oficial do Playwright, `WEB_BASE_URL`, dependência de `web`, fora do runtime do produto. O comando roda `apps/web/test/ui/layout.spec.ts`

**Checkpoint**: A largura se prova no Docker, não na máquina do desenvolvedor.

---

## Phase 7: User Story 5 - Falhar sem página de erro genérica (Priority: P2)

**Goal**: Falha, ambiente ausente e sessão vencida mostram frase em português e um próximo passo.

**Independent Test**: Com a leitura indisponível, a rede mostra a frase de falha e um jeito de tentar de novo, sem "Application error".

### Tests for User Story 5

- [X] T034 [P] [US5] E2E em `apps/web/test/e2e/failure-page.e2e.ts`. Sessão ausente leva à entrada com "Sessão encerrada. Entre de novo." Ambiente fora do alcance mostra "Ambiente não encontrado." e volta à rede. Falha de carga mostra "Não foi possível carregar. Tente de novo." O HTML não contém "Application error"

### Implementation for User Story 5

- [X] T035 [US5] Em `apps/web/src/app/rede/page.tsx`, `apps/web/src/app/ambientes/[id]/page.tsx` e `apps/web/src/app/entrar/page.tsx`, tratar 401 como `/entrar?aviso=sessao`, 404 como ambiente não encontrado e falha de rede ou 5xx como a frase de tentar de novo. Não lançar a página genérica de exceção. Depende de T015, T022 e T029

**Checkpoint**: As quatro rotas degradam com frase, não com exceção.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Leitura nova sem perder o lugar, e a validação do quickstart

- [X] T036 [P] Em `apps/web/src/components/live-refresh.tsx`, atualizar rede e detalhe sem recarregar por completo, preservando o agrupamento da URL e a posição da página
- [X] T037 Rodar os cenários de `specs/002-operational-interface/quickstart.md`: `docker compose run --rm unit-tests`, `docker compose run --rm e2e-tests` e `docker compose --profile test run --rm ui-tests`
- [X] T038 Conferir que código de aplicação, teste e migration não passam de 300 linhas e que `WEB_BASE_URL` está no `.env.example`. `spec.md` e `tasks.md` ficam fora desse limite

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: começa agora
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias
- **Histórias (Phase 3+)**: dependem da fundação. US1, US2 e o miolo da US3 não dependem entre si
- **Polish (Phase 8)**: depois das histórias desejadas

### User Story Dependencies

- **US1 (P1)**: depois da fundação. Não depende de outra história. MVP
- **US2 (P1)**: depois da fundação. O detalhe abre direto, sem a rede
- **US3 (P1)**: sessão, barra e entrada não dependem da US1. T030 edita a página da US1 e espera T015
- **US4 (P2)**: depois de US1, US2 e US3, porque mede essas telas
- **US5 (P2)**: depois de US1, US2 e US3, porque completa as mesmas páginas

### Within Each User Story

- Teste primeiro, e falhando, antes da implementação
- Repository antes do service, service antes do controller
- Um service, um caso de uso, um arquivo de até 300 linhas
- A tela não recalcula conforto, expediente nem autorização

### Parallel Opportunities

- T002 e T003 juntos, depois T001 pode ir junto também
- T005, T007 e T009 juntos; T006 antes de T008
- T011 e T012 juntos; T013 e T014 juntos; T015 depois dos dois
- T016 e T017 juntos; T018 e T020 juntos
- T023, T024 e T029 juntos; T025 antes de T026 e T027
- US1, US2 e a sessão da US3 em paralelo depois da fundação
- US4 e US5 não editam as páginas ao mesmo tempo que US1, US2 ou US3

---

## Parallel Example: User Story 1

```bash
# Testes da US1 juntos:
Task: "E2E da ordem em apps/api-server/test/e2e/store-order.e2e.ts"
Task: "E2E do HTML em apps/web/test/e2e/network-page.e2e.ts"

# Implementação em arquivos diferentes:
Task: "ORDER BY em apps/api-server/src/repositories/store-list.repository.ts"
Task: "Bloco em apps/web/src/components/store-card.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Terminar Phase 1 e Phase 2
2. Terminar Phase 3 (US1)
3. Parar e validar a rede: a loja fora da faixa é o primeiro bloco
4. Só então seguir para US2 e US3

### Incremental Delivery

1. Fundação pronta: marca, contraste e mensagens
2. US1 demonstra a rede
3. US2 acrescenta o gráfico
4. US3 fecha entrada, barra e saída
5. US4 e US5 entram sem quebrar o que já passou

### Parallel Team Strategy

Com a fundação pronta: uma pessoa na US1, outra na US2, outra na sessão da US3. Quem pegar T030 espera a página da US1. US4 e US5 ficam para o fim.

---

## Notes

- `[P]` significa arquivo diferente e sem dependência incompleta
- Não calcular conforto, expediente nem autorização no frontend
- Não reordenar a rede no browser
- Horário exibido usa o `timezone` da loja
- Pare em qualquer checkpoint e valide só aquela história
