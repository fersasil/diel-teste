# Research: Interface operacional Celsius 360

## Identidade visual

**Decision**: Usar as cores que mais aparecem no site público
[dielenergia.com](https://dielenergia.com/) em 2026-11-05, depois da renovação de
outubro de 2026. Texto `#0F172A` sobre `#FFFFFF`. Superfície e divisória
`#E2E8F0`. Botão com texto `#FFFFFF` sobre `#2547D0` (contraste 7,26 para 1).
Acento de gráfico e foco `#00A3FF`, que não recebe texto branco (contraste
2,73). Marcas de estado, sem serem a cor do texto: dentro da faixa `#39B719`,
acima `#F93A3A`, abaixo `#00A3FF`, sem dados e offline `#CBD5E1`. O logotipo
é o SVG `assets/img/logo-diel-energia-header.svg` desse site, copiado para
`apps/web/public/brand/`. A fonte é Inter, a mesma família servida pelo site,
em arquivo local, para a imagem Docker construir sem rede.

**Rationale**: A especificação manda o plano extrair a marca do site, porque
não há manual no repositório. Os pares de texto passam de 4,5 para 1. O
acento ciano fica no gráfico, não na letra.

**Alternatives considered**: Inventar uma paleta verde de energia foi
descartado. Texto branco sobre `#00A3FF` foi descartado pelo contraste.
Baixar a fonte na build foi descartado porque a imagem precisa construir
offline.

## Gráfico

**Decision**: Gráfico em SVG desenhado com os pontos que a API já devolve.
Sem biblioteca de gráfico.

**Rationale**: Média, mínima, máxima, lacuna, expediente e temperatura
externa já vêm calculados. O desenho só liga pontos e interrompe a linha
quando a temperatura vem nula. Uma biblioteca nova aumentaria dependência e
empurraria o arquivo para além de 300 linhas.

**Alternatives considered**: Biblioteca de gráfico pronta foi rejeitada por
dependência e tamanho. Lista de números, que é a tela atual, não cumpre a
história.

## Ordem e paginação

**Decision**: A ordem "fora da faixa primeiro, depois o nome" fica no SQL da
listagem, antes de `LIMIT`/`OFFSET`. A resposta já traz `page`, `pageSize` e
`total`. A tela pede a página seguinte. O frontend não reordena.

**Rationale**: Ordenar só a página já carregada esconderia uma exceção na
página 2. A constituição exige que a tela exiba o que a API devolve.

**Alternatives considered**: Ordenar no browser foi rejeitado por quebrar a
paginação. Trazer todas as lojas e paginar na tela foi rejeitado porque a
API já limita a página.

## Horário e temperatura na tela

**Decision**: A API continua em UTC e passa a devolver `timezone` e
`storeName` no resumo do ambiente. A tela formata o eixo com esse fuso, não
com o fuso do aparelho, e mostra o nome do fuso uma vez. Temperatura exibida
com uma casa decimal e `°C`. Conforto, expediente e status não são
recalculados.

**Rationale**: O dado de negócio já está no banco (`stores.timezone`).
Formatar não é regra de conforto. Usar o fuso do browser violaria a
constituição.

**Alternatives considered**: Devolver o horário já como frase pronta foi
rejeitado porque cada ponto do gráfico precisaria de uma frase e a série
continua um contrato numérico. Recalcular expediente na tela foi rejeitado.

## Sessão visível

**Decision**: `GET /api/v1/auth/session` devolve `profile`, `clientId` e
`clientName`. A barra traduz o perfil no frontend. Sair apaga o cookie de
sessão e não apaga o cliente em foco guardado para o operador. Sem sessão, a
rede não abre. Operador sem foco continua caindo na escolha de cliente.

**Rationale**: O cookie atual só tem o token. A barra precisa do perfil e do
nome do cliente sem decodificar autorização na tela. Manter o foco depois de
sair evita que o operador escolha de novo ao entrar, e a rede só abre com
sessão válida.

**Alternatives considered**: Guardar o perfil num segundo cookie foi
rejeitado porque a barra ficaria desatualizada quando o foco muda. Apagar o
foco ao sair foi rejeitado porque a história pede que a rede deixe de abrir,
não que a preferência suma.

## Prova na stack

**Decision**: Teste unitário do contraste, da formatação e da montagem da
sessão roda no serviço `unit-tests`, nos workspaces `api-server` e `web`.
O e2e atual passa a pedir o HTML do frontend (`WEB_BASE_URL`) e confere
frase, ordem e rótulo do gráfico. Rolagem horizontal e teclado rodam num
serviço `ui-tests`, perfil `test`, na imagem oficial do Playwright, fora do
runtime do produto.

**Rationale**: A constituição exige as duas suítes no Docker e, em mudança
de tela, o frontend na stack. O corpo HTML não mede rolagem. Playwright no
produto seria dependência de runtime sem necessidade.

**Alternatives considered**: Conferir só o arquivo de mensagens, como o e2e
da plataforma faz hoje, não prova a tela. Rodar o browser na máquina do
desenvolvedor fica fora da stack.
