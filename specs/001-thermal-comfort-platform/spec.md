# Feature Specification: Celsius 360 Lite

**Feature Branch**: `001-thermal-comfort-platform`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Plataforma SaaS multi-tenant de monitoramento térmico contínuo para redes de varejo e agências bancárias. O relato técnico original está em docs/celsius-360/."

## Clarifications

### Session 2026-11-04

- Q: Quem pode ver lojas de mais de um cliente? → A: Só o operador Diel, com perfil global. Gestor e gerente ficam no próprio cliente. O seletor do operador foca um cliente por vez.
- Q: Quando uma loja tem vários ambientes, o que a visão da rede mostra sobre o conforto dessa loja? → A: A loja aparece uma vez e mostra quantos ambientes estão dentro, acima, abaixo e sem dados.
- Q: Quem pode listar os lotes originais de um dia? → A: O operador Diel, no cliente em foco, e o gestor de rede, no próprio cliente.
- Q: No detalhe do ambiente, qual intervalo agrupa a temperatura da série? → A: A pessoa escolhe na tela: 15 minutos, 30 minutos ou 1 hora.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a rede fora de conforto (Priority: P1)

O gestor de rede abre a visão da rede e identifica, no expediente, quais lojas estão fora da faixa. Cada loja aparece uma vez, com a quantidade de ambientes dentro, acima, abaixo e sem dados.

**Why this priority**: É a meta de visibilidade operacional. Sem essa tela, o produto não cumpre o motivo de existir.

**Independent Test**: Com um cliente, lojas de vários ambientes e leituras já aceitas, o gestor encontra a loja cuja contagem acima ou abaixo é maior que zero.

**Acceptance Scenarios**:

1. **Given** um gestor do cliente A e lojas com ambientes dentro, acima, abaixo e sem leitura, **When** ele abre a visão da rede, **Then** cada loja aparece uma vez e mostra essas quatro quantidades.
2. **Given** centenas de lojas do mesmo cliente, **When** ele pede a listagem, **Then** a página atual respeita o alcance dele e informa o conforto vigente no expediente.

---

### User Story 2 - Investigar um ambiente (Priority: P1)

O gestor abre o detalhe de um ambiente e vê a temperatura ao longo de até 30 dias, com lacunas onde não houve leitura e com a marcação de expediente.

**Why this priority**: A listagem mostra o agora. O detalhe explica o período e evita tratar buraco de sensor como conforto.

**Independent Test**: Um ambiente com leituras e um intervalo sem dados exibe a série no agrupamento escolhido, com a faixa e os buracos, sem inventar temperatura.

**Acceptance Scenarios**:

1. **Given** um ambiente com histórico de até 30 dias, **When** o gestor abre o detalhe, **Then** a série começa em 30 minutos e ele pode trocar para 15 minutos ou 1 hora.
2. **Given** um agrupamento escolhido, **When** a série é exibida, **Then** cada intervalo mostra média, mínima, máxima e se caiu no expediente.
3. **Given** um intervalo sem leituras, **When** a série é exibida, **Then** o intervalo aparece como lacuna, sem temperatura inventada.

---

### User Story 3 - Entrar só no próprio alcance (Priority: P1)

A pessoa entra com e-mail e senha. Gestor e gerente veem apenas o próprio cliente, e o gerente vê só as lojas da lista dele. O operador Diel vê todos os clientes e usa o seletor para focar um cliente por vez. Sem esse foco, ele ainda não vê lojas.

**Why this priority**: A plataforma é multi-tenant. Uma tela certa para o cliente errado quebra o produto.

**Independent Test**: Dois clientes populados. Gestor e gerente do cliente A não veem loja do cliente B. O operador focado em A também não vê loja de B. O gerente com uma loja na lista não vê as outras lojas do mesmo cliente.

**Acceptance Scenarios**:

1. **Given** um gestor ou gerente do cliente A, **When** ele lista lojas, **Then** nenhuma loja do cliente B aparece.
2. **Given** o operador Diel, **When** ele foca o cliente A, **Then** vê as lojas de A e nenhuma loja de B até focar B.
3. **Given** o operador Diel sem cliente em foco, **When** ele abre a visão da rede, **Then** a lista de lojas fica vazia e a tela pede a escolha de um cliente.
4. **Given** um gerente restrito a uma loja, **When** ele abre a visão da rede, **Then** só essa loja aparece.
5. **Given** credenciais inválidas, **When** ele tenta entrar, **Then** a sessão não abre e a mensagem exibida está em português.

---

### User Story 4 - Saber se o sensor está presente (Priority: P2)

Na visão da rede e no detalhe, a pessoa distingue sensor presente, ausente há mais de 15 minutos e ambiente que nunca enviou leitura.

**Why this priority**: Loja sem dado não pode parecer confortável. O relógio da plataforma é o da última leitura processada, não o relógio do navegador.

**Independent Test**: Três ambientes: leitura recente, leitura antiga e nenhuma leitura. Os três status aparecem corretos contra o relógio da plataforma.

**Acceptance Scenarios**:

1. **Given** o relógio da plataforma e uma última leitura há 15 minutos ou menos, **When** a pessoa vê o ambiente, **Then** o status é online.
2. **Given** a última leitura há mais de 15 minutos, **When** a pessoa vê o ambiente, **Then** o status é offline.
3. **Given** um ambiente sem nenhuma leitura, **When** a pessoa vê o ambiente, **Then** o status é sem dados.

---

### User Story 5 - Confiar na leitura (Priority: P2)

Leitura impossível não entra no conforto. Pacote atrasado entra na hora em que a temperatura aconteceu. Repetir o mesmo pacote não duplica a amostra nem muda o resultado daquela hora.

**Why this priority**: Diagnóstico errado leva o gestor a agir sobre loja que está normal, ou a ignorar loja que esteve quente no passado.

**Independent Test**: Enviar uma leitura de 80 °C, um pacote atrasado e o mesmo pacote duas vezes. A anomalia fica registrada, a série histórica fica na hora certa e existe uma amostra por ambiente e instante.

**Acceptance Scenarios**:

1. **Given** uma leitura abaixo de −10 °C ou acima de 60 °C, **When** ela é processada, **Then** ela não entra na série tratada e fica registrada como anomalia.
2. **Given** uma leitura de −10 °C ou de 60 °C, **When** ela é processada, **Then** ela permanece na série tratada.
3. **Given** um pacote atrasado com várias amostras, **When** ele é aceito, **Then** cada amostra fica no instante histórico dela e o resumo do período passa a incluí-la.
4. **Given** o mesmo pacote entregue de novo, **When** ele é processado outra vez, **Then** continuam uma temperatura, um expediente e um conforto para aquele ambiente e aquele instante.

---

### User Story 6 - Comparar com o clima externo (Priority: P3)

No detalhe do ambiente, a pessoa vê a temperatura externa da cidade da loja junto da série interna, para separar calor da rua de problema do ambiente.

**Why this priority**: Ajuda o diagnóstico, mas a decisão de conforto já existe sem esse contexto.

**Independent Test**: Uma loja com temperatura externa registrada no período exibe esse valor no detalhe, sem alterar a faixa de conforto do ambiente.

**Acceptance Scenarios**:

1. **Given** temperatura externa da cidade no período, **When** o gestor abre o detalhe, **Then** a série interna e a temperatura externa aparecem juntas.
2. **Given** temperatura externa acima da faixa interna, **When** o conforto é calculado, **Then** a faixa continua sendo a do ambiente, não a da rua.

---

### User Story 7 - Recuperar o pacote original (Priority: P3)

O operador Diel, no cliente em foco, e o gestor de rede, no próprio cliente, localizam o lote original de um dia para auditoria. O gerente de loja não lista esses lotes. O gráfico operacional não usa o lote bruto.

**Why this priority**: A operação precisa rastrear a origem da leitura. O gerente não precisa dessa tela para ver conforto.

**Independent Test**: Depois de um lote aceito, gestor e operador no cliente certo encontram o lote do dia. O gerente não recebe lote.

**Acceptance Scenarios**:

1. **Given** um lote aceito numa data do cliente A, **When** o gestor de A ou o operador focado em A pede os lotes desse dia, **Then** o lote aparece.
2. **Given** o mesmo lote, **When** o gerente de uma loja de A pede os lotes, **Then** ele não recebe lote.
3. **Given** um gestor na visão da rede, **When** ele olha o conforto, **Then** o número vem da série tratada, não de uma varredura do arquivo original.

---

### Edge Cases

- Pacote com N leituras e intervalo fixo vira N amostras. A última coincide com o instante do pacote. Cada anterior recua um intervalo.
- Expediente é avaliado no fuso da loja. O instante guardado é universal.
- Fora do expediente a leitura continua guardada, mas o percentual de conforto só conta amostras dentro do expediente.
- Ambiente sem leitura não entra como dentro da faixa. Na visão da rede ele soma em sem dados.
- As quatro quantidades de uma loja somam o total de ambientes dessa loja.
- Usuário sem loja permitida vê lista vazia, não a rede inteira.
- Operador Diel sem cliente em foco vê lista vazia de lojas e não lista lote original. Com foco num cliente, não vê loja nem lote dos demais.
- Rajada de pacotes atrasados não impede quem já está no painel de abrir a visão da rede.
- Leitura só é considerada aceita quando o original ficou arquivado e a amostra tratada ficou guardada. Se um dos dois falha, a leitura não é confirmada.
- Texto visível na tela está em português do Brasil, inclusive erro de entrada e estado vazio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST permitir entrada com e-mail e senha.
- **FR-002**: Gestor e gerente MUST ver só lojas e ambientes do próprio cliente.
- **FR-003**: O gerente de loja MUST ver somente as lojas da lista dele.
- **FR-004**: O gestor de rede MUST ver as lojas do próprio cliente.
- **FR-005**: Gestor e gerente MUST NOT ver loja de outro cliente, nem pelo seletor.
- **FR-006**: O seletor do operador Diel MUST focar um cliente por vez. Sem foco, a lista de lojas MUST ficar vazia. Com foco, lojas de outros clientes MUST NOT aparecer.
- **FR-007**: A visão da rede MUST ser paginada, MUST mostrar uma linha por loja e MUST informar quantos ambientes estão dentro da faixa, acima, abaixo e sem dados. Sem dados MUST contar só ambiente que nunca enviou leitura. As outras três quantidades MUST usar o conforto da última leitura aceita. As quatro MUST somar o total de ambientes da loja.
- **FR-008**: Cada ambiente MUST ter faixa mínima e máxima próprias e expediente próprio.
- **FR-009**: O conforto de uma amostra MUST ser dentro, acima ou abaixo da faixa daquele ambiente.
- **FR-010**: O percentual de conforto MUST usar só amostras dentro do expediente.
- **FR-011**: O expediente MUST ser interpretado no fuso da loja.
- **FR-012**: O "agora" da plataforma MUST ser o instante da leitura processada mais recente, não o relógio do aparelho de quem olha.
- **FR-013**: O status MUST ser online até 15 minutos, offline acima de 15 minutos e sem dados quando não existe leitura.
- **FR-014**: O detalhe MUST mostrar a série de até 30 dias. A pessoa MUST escolher o agrupamento entre 15 minutos, 30 minutos e 1 hora. Ao abrir, o agrupamento MUST ser 30 minutos. Cada intervalo MUST mostrar média, mínima, máxima e se caiu no expediente.
- **FR-015**: Intervalo sem leitura MUST aparecer como lacuna, no agrupamento escolhido.
- **FR-016**: Leitura abaixo de −10 °C ou acima de 60 °C MUST ficar fora da série tratada e MUST ser registrada como anomalia.
- **FR-017**: Leitura de −10 °C e de 60 °C MUST permanecer na série tratada.
- **FR-018**: Pacote atrasado MUST gravar cada amostra no instante histórico dela, e o resumo do período MUST incluí-la.
- **FR-019**: Reprocessar a mesma amostra MUST manter uma única temperatura, um expediente e um conforto para o par ambiente e instante.
- **FR-020**: Leitura aceita MUST permanecer na série tratada e MUST poder ser rastreada até o lote original.
- **FR-021**: O produto MUST continuar mostrando a visão da rede enquanto absorve uma rajada de pacotes atrasados.
- **FR-022**: A visão da rede e o detalhe MUST refletir leitura nova aceita sem a pessoa recarregar a página.
- **FR-023**: O detalhe MUST mostrar a temperatura externa da cidade da loja sem usá-la como faixa de conforto.
- **FR-024**: O operador Diel MUST listar lotes originais por dia do cliente em foco. O gestor de rede MUST listar os lotes por dia do próprio cliente. O gerente de loja MUST NOT listar lotes originais.
- **FR-025**: Todo texto visível MUST estar em português do Brasil.
- **FR-026**: A identidade visual MUST seguir a marca institucional Diel Energia.
- **FR-027**: Loja MUST pertencer a um cliente e MUST ter cidade, UF, coordenadas e fuso.
- **FR-028**: O operador Diel MUST ter perfil global e MUST poder escolher qualquer cliente no seletor.

### Key Entities

- **Cliente**: rede atendida. Agrupa lojas e usuários.
- **Loja**: unidade com cidade, UF, coordenadas, fuso e expediente de referência.
- **Ambiente**: cômodo monitorado de uma loja, com faixa de conforto, expediente, dispositivo e último estado.
- **Usuário**: pessoa com e-mail e uma persona. Gestor e gerente têm um cliente. O gerente tem a lista de lojas permitidas. O operador Diel não tem cliente fixo e escolhe o cliente em foco.
- **Amostra tratada**: temperatura de um ambiente num instante, com expediente, conforto e indicação de pacote atrasado.
- **Resumo horário**: totais de amostras, conforto, acima, abaixo e temperaturas do ambiente naquela hora de expediente.
- **Anomalia**: leitura rejeitada, com valor, motivo e ligação com o lote original.
- **Lote original**: arquivo do pacote bruto de um dia e hora, usado para auditoria.
- **Clima externo**: temperatura da cidade da loja num instante.
- **Relógio da plataforma**: instante da leitura processada mais recente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A listagem de centenas de lojas mostra o conforto vigente em menos de 30 milissegundos a partir do pedido dessa lista.
- **SC-002**: O histórico de 30 dias de um ambiente, com lacunas, aparece em menos de 100 milissegundos a partir do pedido.
- **SC-003**: Num dia com 20 GB de leituras brutas e picos de 3.000 a 5.000 leituras por segundo, uma pessoa que já está no painel ainda abre a visão da rede.
- **SC-004**: Em teste com dois clientes, gestor, gerente e o operador focado no cliente A veem zero lojas do cliente B.
- **SC-005**: 100% das leituras fora de −10 °C a 60 °C ficam ausentes dos totais de conforto e presentes no registro de anomalia.
- **SC-006**: Reenviar o mesmo pacote deixa uma amostra por ambiente e instante.
- **SC-007**: Num roteiro com ao menos uma loja que tenha ambiente acima ou abaixo da faixa, o gestor aponta essa loja na primeira tentativa, pela contagem da linha, sem abrir todas as lojas.

## Assumptions

- A v1 tem três personas: gestor de rede, gerente de loja e operador Diel. Só o operador troca o cliente em foco.
- Os limites −10 °C e 60 °C são inclusivos. Fora desse intervalo a leitura é anomalia.
- O expediente de cada ambiente é uma agenda semanal de intervalos no horário local da loja.
- As telas interativas cobrem 30 dias. Histórico tratado mais antigo permanece guardado, fora da meta de resposta desta versão.
- O lote original não tem prazo de apagamento nesta versão.
- Recuperação de senha, aplicativo nativo e cadastro self-service de cliente ficam fora desta versão.
- A temperatura externa é contexto da cidade. Ela não redefine a faixa do ambiente.
- O alimentador de leituras a partir de um arquivo preparado é apoio de demonstração, não uma tela do gestor.
- O relato técnico original está em `docs/celsius-360/`. Esta especificação fixa o comportamento observável. Onde os dois divergirem, valem esta especificação e a constituição do projeto.
