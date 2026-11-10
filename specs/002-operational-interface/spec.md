# Feature Specification: Interface operacional Celsius 360

**Feature Branch**: `002-operational-interface`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Criar uma história de aparência, usabilidade e interface. As telas atuais não têm identidade visual. O pedido foi decidir o desenho."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enxergar a exceção na rede (Priority: P1)

O gestor abre a visão da rede e, antes de ler ambiente por ambiente, vê qual loja está fora da faixa. Cada loja aparece uma vez, como um bloco, com as quantidades dentro, acima, abaixo e sem dados, mais online e offline. Loja com alguém acima ou abaixo vem na frente.

**Why this priority**: A tela existe e entrega os números, mas numa lista corrida a exceção não salta. Sem isso o produto não cumpre o motivo de ser aberto.

**Independent Test**: Com uma loja toda dentro da faixa e outra com ao menos um ambiente acima ou abaixo, a segunda aparece primeiro e os quatro estados se distinguem pelo texto e pelo tratamento visual.

**Acceptance Scenarios**:

1. **Given** lojas do alcance do gestor, **When** ele abre a visão da rede, **Then** cada loja aparece uma vez, com o nome da loja e as quantidades dentro da faixa, acima, abaixo, sem dados, online e offline.
2. **Given** uma loja com contagem acima ou abaixo maior que zero e outra sem, **When** a lista é exibida, **Then** a loja fora da faixa aparece antes.
3. **Given** mais lojas do que cabem na primeira página, **When** a pessoa olha o fim da página, **Then** ela percebe que há mais e consegue abrir a página seguinte sem perder o que já viu.
4. **Given** um ambiente da loja, **When** a pessoa aciona o nome dele, **Then** abre o detalhe daquele ambiente.

---

### User Story 2 - Ler o ambiente num gráfico (Priority: P1)

A pessoa abre o detalhe e vê a temperatura do ambiente num gráfico, não numa lista de números. A faixa de conforto, a média, a mínima, a máxima, a lacuna, o expediente e a temperatura externa são coisas diferentes na mesma tela.

**Why this priority**: O detalhe hoje lista instantes técnicos. Quem opera não consegue apontar a lacuna nem separar o clima da sala.

**Independent Test**: Um ambiente com leituras, um intervalo sem leitura e temperatura externa mostra os três fatos distinguíveis, no agrupamento de 30 minutos, com caminho de volta à rede.

**Acceptance Scenarios**:

1. **Given** um ambiente com histórico, **When** a pessoa abre o detalhe, **Then** vê o nome do ambiente, o nome da loja, a faixa de conforto e o status do sensor por extenso.
2. **Given** a abertura do detalhe, **When** nenhum agrupamento foi escolhido, **Then** o gráfico usa 30 minutos e a opção de 30 minutos aparece marcada. A pessoa pode trocar para 1 hora, 1 dia, 1 semana ou 1 mês, e a marcação acompanha a troca.
3. **Given** um intervalo sem leitura, **When** o gráfico é exibido, **Then** aquele trecho aparece como lacuna, sem temperatura inventada.
4. **Given** temperatura externa da cidade, **When** ela aparece junto da série, **Then** está rotulada como temperatura externa e não se confunde com a temperatura do ambiente nem com a faixa de conforto.
5. **Given** o detalhe aberto, **When** a pessoa pede para voltar, **Then** retorna à visão da rede.

---

### User Story 3 - Entrar e saber quem está olhando (Priority: P1)

A entrada, a escolha de cliente e o interior do produto parecem o mesmo sistema. Depois de entrar, a pessoa vê o próprio perfil e consegue sair. O operador vê o cliente em foco e consegue trocá-lo.

**Why this priority**: Sem uma entrada reconhecível e sem saída, a tela operacional parece um rascunho e a sessão fica presa.

**Independent Test**: Credencial errada mantém o e-mail e mostra o erro no formulário. Credencial certa chega à rede, ou à escolha de cliente no caso do operador, com a marca visível e um controle de sair.

**Acceptance Scenarios**:

1. **Given** a tela de entrada, **When** ela é exibida, **Then** mostra a marca Diel, o nome Celsius 360, os campos de e-mail e senha e o botão Entrar.
2. **Given** e-mail preenchido e senha errada, **When** a pessoa envia, **Then** a frase "E-mail ou senha inválidos." aparece junto do formulário e o e-mail permanece.
3. **Given** um gestor ou gerente autenticado, **When** qualquer tela interna abre, **Then** a barra mostra o perfil em português (Gestor de rede ou Gerente de loja) e a ação Sair.
4. **Given** o operador Diel sem cliente em foco, **When** ele entra, **Then** cai na escolha de cliente, no mesmo visual, e só depois vê a rede do cliente escolhido. A barra mostra Operador Diel, o cliente em foco e a ação Trocar cliente.
5. **Given** uma sessão ativa, **When** a pessoa aciona Sair, **Then** volta à entrada e a rede deixa de abrir o alcance anterior.

---

### User Story 4 - Caber no notebook e no celular (Priority: P2)

A mesma tarefa cabe numa tela larga de notebook e numa tela estreita de celular, sem a página escorregar para o lado.

**Why this priority**: Gestor e gerente olham a rede na mesa e no deslocamento. O gráfico e os blocos de loja precisam continuar legíveis nos dois.

**Independent Test**: Nos dois tamanhos, a pessoa entra, acha a loja fora da faixa e abre o detalhe sem rolagem horizontal da página.

**Acceptance Scenarios**:

1. **Given** a largura de um notebook comum, **When** a pessoa percorre entrada, rede e detalhe, **Then** o conteúdo principal cabe sem rolagem horizontal.
2. **Given** a largura de um celular, **When** a pessoa faz o mesmo percurso, **Then** os blocos de loja empilham, o gráfico continua mostrando faixa, média e lacuna, e os controles de agrupamento cabem na tela.
3. **Given** nome longo de loja ou ambiente, **When** a tela estreita, **Then** o nome quebra em mais linhas e não cobre outro texto.

---

### User Story 5 - Falhar sem página de erro genérica (Priority: P2)

Quando a leitura não vem, a sessão vence ou o ambiente não existe, a pessoa vê uma frase em português e um próximo passo. Não vê uma página de exceção.

**Why this priority**: A rede já quebrou numa página de erro quando a leitura falhou. Isso apaga a confiança no número que a tela deveria mostrar.

**Independent Test**: Com o serviço de leitura indisponível, a visão da rede mostra a frase de falha e um jeito de tentar de novo, com a marca ainda visível.

**Acceptance Scenarios**:

1. **Given** a visão da rede sem lojas no alcance, **When** a leitura funciona, **Then** aparece "Nenhuma loja neste alcance." dentro do visual do produto.
2. **Given** falha ao carregar a rede ou o detalhe, **When** a tela abre, **Then** aparece "Não foi possível carregar. Tente de novo." e a pessoa consegue tentar de novo.
3. **Given** um ambiente fora do alcance ou inexistente, **When** a pessoa abre o detalhe, **Then** aparece "Ambiente não encontrado." e um caminho de volta à rede.
4. **Given** a sessão vencida, **When** a pessoa abre uma tela interna, **Then** volta à entrada com a frase "Sessão encerrada. Entre de novo."

---

### Edge Cases

- Todas as lojas dentro da faixa: a lista continua completa e nenhuma loja é pintada como exceção.
- Todas sem dados: as quantidades aparecem, sem cor de conforto.
- Uma loja só, no caso do gerente: o mesmo bloco, sem grade quebrada.
- Gráfico com um único ponto, ou com uma lacuna longa no meio: o ponto existe e o buraco continua visível.
- Atualização de leitura nova: o agrupamento escolhido e a posição da página permanecem.
- Página seguinte não existe: o controle de avançar não finge que há mais.
- Operador que troca de cliente: a rede passa a mostrar só o cliente novo, sem resto visual do anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Entrada, escolha de cliente, visão da rede e detalhe do ambiente MUST compartilhar a mesma marca, a mesma tipografia, o mesmo espaçamento e a mesma barra de sessão.
- **FR-002**: A marca visível MUST ser a identidade institucional atual da Diel Energia, a publicada no site público depois da renovação de outubro de 2026. O nome do produto na tela MUST ser Celsius 360.
- **FR-003**: Dentro da faixa, acima, abaixo e sem dados MUST ter rótulo em português e tratamento visual distinto. O sentido MUST permanecer se a cor for removida.
- **FR-004**: Online, offline e sem dados do sensor MUST seguir a mesma regra de rótulo mais tratamento, sem depender só da cor.
- **FR-005**: Texto corrido e rótulo de estado MUST ter contraste de pelo menos 4,5 para 1 com o fundo.
- **FR-006**: A visão da rede MUST mostrar uma loja por bloco, com as quantidades já definidas para conforto e presença. Loja com quantidade acima ou abaixo maior que zero MUST aparecer antes das demais.
- **FR-007**: Quando houver mais lojas do que a página mostra, a pessoa MUST ver que existem mais e MUST conseguir ir à página seguinte e voltar à anterior.
- **FR-008**: O nome do ambiente MUST ser o acionável que abre o detalhe. O detalhe MUST mostrar o nome do ambiente, o nome da loja, a faixa de conforto com unidade °C e o status do sensor.
- **FR-009**: O detalhe MUST mostrar um gráfico do agrupamento escolhido. Cada intervalo MUST deixar visíveis a média, a mínima, a máxima, se caiu no expediente e, quando não houver leitura, a lacuna.
- **FR-010**: Ao abrir, o agrupamento MUST ser 30 minutos. As opções MUST ser 30 minutos, 1 hora, 1 dia, 1 semana e 1 mês. A opção ativa MUST aparecer marcada.
- **FR-011**: A temperatura externa MUST aparecer rotulada como "Temperatura externa", separada da série do ambiente e da faixa de conforto. Ela MUST NOT alterar a faixa.
- **FR-012**: Horário lido pela pessoa, inclusive o eixo do gráfico, MUST estar no fuso da loja. O nome do fuso MUST aparecer uma vez no detalhe. Instante em horário universal cru MUST NOT aparecer.
- **FR-013**: Temperatura lida pela pessoa MUST usar a unidade °C e uma casa decimal.
- **FR-014**: A barra de sessão MUST mostrar o perfil em português: Operador Diel, Gestor de rede ou Gerente de loja. MUST haver a ação Sair. Para o operador, MUST mostrar o cliente em foco e a ação Trocar cliente.
- **FR-015**: Sair MUST encerrar a sessão e devolver a pessoa à entrada. Trocar cliente MUST devolver o operador à escolha de cliente.
- **FR-016**: Erro de credencial MUST mostrar "E-mail ou senha inválidos." no formulário e MUST manter o e-mail digitado.
- **FR-017**: Lista vazia MUST mostrar "Nenhuma loja neste alcance." Falha de carga MUST mostrar "Não foi possível carregar. Tente de novo." Ambiente inexistente ou fora do alcance MUST mostrar "Ambiente não encontrado." Sessão vencida MUST mostrar "Sessão encerrada. Entre de novo."
- **FR-018**: Nenhuma dessas falhas MUST resultar numa página genérica de exceção.
- **FR-019**: Entrada, rede e detalhe MUST ser utilizáveis na largura de um notebook comum e na largura de um celular, sem rolagem horizontal da página. Nome longo MUST quebrar a linha.
- **FR-020**: Entrar, Sair, Trocar cliente, voltar à rede, abrir um ambiente e trocar o agrupamento MUST funcionar por teclado, com foco visível.
- **FR-021**: Leitura nova aceita MUST atualizar a rede e o detalhe sem recarregar a página por completo, preservando o agrupamento escolhido e a posição em que a pessoa estava.
- **FR-022**: Todo texto visível desta história MUST estar em português do Brasil. Código de erro, identificador técnico de perfil e corpo de lote MUST NOT aparecer na tela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num roteiro com ao menos uma loja fora da faixa, a pessoa aponta essa loja em até 10 segundos, sem abrir os ambientes.
- **SC-002**: No detalhe, a pessoa distingue, numa única olhada, a faixa de conforto, uma lacuna e a temperatura externa.
- **SC-003**: Com senha errada, o erro aparece e o e-mail permanece. Com senha certa, gestor e gerente chegam à rede, e o operador chega à escolha de cliente, em até 30 segundos.
- **SC-004**: O percurso entrar, achar a loja e abrir o detalhe se completa sem rolagem horizontal nas duas larguras: notebook comum e celular.
- **SC-005**: Texto corrido e rótulos de estado medem contraste de pelo menos 4,5 para 1.
- **SC-006**: Com a leitura indisponível, a pessoa vê a frase de falha em português e um controle para tentar de novo. A página genérica de exceção não aparece.

## Assumptions

- O desenho foi escolhido nesta história porque o pedido foi decidir a aparência. Não há manual de marca no repositório. A referência é o site público dielenergia.com depois da renovação anunciada em outubro de 2026. O plano extrai dali as cores e o logotipo concretos. Se um manual for entregue depois, o manual prevalece sobre o site.
- Esta história veste as telas que já existem. Não muda contagem de conforto, faixa, expediente, agrupamento padrão, alcance de gestor, gerente e operador, nem o fato de o operador focar um cliente por vez.
- O seletor rápido de persona citado no relato técnico antigo fica de fora. Quem aparece na barra é a pessoa que entrou.
- Lista de lotes originais, mapa, exportação, modo escuro, aviso sonoro e aplicativo nativo ficam de fora.
- Ordenar a exceção na frente é regra desta história. Página cheia informa que há mais; a página seguinte continua a mesma ordem.
- "Notebook comum" significa cerca de 1280 px de largura. "Celular" significa cerca de 390 px de largura.
- O contraste de 4,5 para 1 é o patamar usado para texto e rótulo. Não se exige esse número em traço decorativo do gráfico.
- Atualizar a tela quando chega leitura nova preserva o lugar da pessoa. Não introduz notificação.
- Onde esta história e a especificação da plataforma divergirem em comportamento de negócio, vale a especificação da plataforma. Onde divergirem no que a pessoa vê, vale esta história.
