# Telas

Texto visível em português, centralizado nas mensagens do frontend. Código de
perfil, código de erro e instante UTC cru não aparecem.

Rotas: `/entrar`, `/entrar/foco`, `/rede`, `/ambientes/{id}`.

## Barra

Presente na escolha de cliente, na rede e no detalhe. Mostra Celsius 360, o
perfil traduzido (Operador Diel, Gestor de rede ou Gerente de loja) e Sair.
No operador com cliente em foco, mostra também o nome do cliente e Trocar
cliente. Sair volta a `/entrar` e a rede deixa de abrir. Trocar cliente volta
a `/entrar/foco`.

## Entrada

Marca Diel, nome Celsius 360, E-mail, Senha, Entrar. Credencial inválida:
"E-mail ou senha inválidos." com o e-mail ainda no campo. Chegada com sessão
vencida: "Sessão encerrada. Entre de novo."

## Escolha de cliente

Só o operador sem foco. O mesmo visual da entrada. Depois da escolha, a rede
mostra só aquele cliente.

## Rede

Um bloco por loja, na ordem da API. Cada bloco tem o nome da loja e os
rótulos Dentro da faixa, Acima, Abaixo, Sem dados, Online e Offline, cada um
com a quantidade. O rótulo permanece legível sem a cor. O nome do ambiente
abre `/ambientes/{id}`.

Lista vazia autorizada: "Nenhuma loja neste alcance."

Se `total` passa da página, a tela mostra a página atual e os caminhos para a
anterior e a seguinte. A seguinte não aparece na última página.

Falha de carga: "Não foi possível carregar. Tente de novo." A tentativa
reabre a mesma página. Isso não é a página genérica de exceção.

## Detalhe

Nome do ambiente, nome da loja, status do sensor por extenso, faixa de
conforto em °C e o fuso uma vez. Voltar retorna a `/rede`.

Gráfico do agrupamento, abrindo em 30 minutos. Opções: 30 minutos, 1 hora,
1 dia, 1 semana e 1 mês. A opção ativa fica marcada. O endereço guarda a escolha.

O gráfico mostra média, mínima, máxima, trecho de expediente, lacuna sem
ponto inventado e a série rotulada "Temperatura externa", separada da faixa.
Temperatura com uma casa decimal e °C. Horário do eixo no fuso da loja.

Leitura nova atualiza números e gráfico sem trocar o agrupamento nem levar a
pessoa ao topo.

Ambiente ausente ou fora do alcance: "Ambiente não encontrado." e volta à
rede.

## Teclado e largura

Entrar, Sair, Trocar cliente, voltar, abrir ambiente e trocar agrupamento são
acionáveis por teclado, com foco visível. Em cerca de 1280 px e em cerca de
390 px a página não rola na horizontal. Nome longo quebra a linha. No
celular os blocos empilham e o gráfico encolhe na largura.
