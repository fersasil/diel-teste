# Quickstart: Interface operacional Celsius 360

Prova a história por cima da stack já descrita em
`specs/001-thermal-comfort-platform/quickstart.md`. Não substitui o roteiro
de ingestão.

## Pré-requisitos

Stack no ar, com o frontend:

```bash
docker compose up -d --build
```

Entrada: http://localhost:3001/entrar

Senha dos usuários de demonstração: `change-me`

- `carlos.mendes@modacarioca.example` — gestor
- `juliana.prado@modacarioca.example` — gerente
- `ana.ribeiro@diel.example` — operador

## O que observar

1. A entrada mostra a marca Diel e o nome Celsius 360. Senha errada mantém o
   e-mail e mostra "E-mail ou senha inválidos."
2. Carlos chega à rede. A loja com ambiente acima ou abaixo aparece antes de
   uma loja só dentro da faixa. Cada loja é um bloco, com os quatro rótulos
   de conforto mais online e offline.
3. Abrir um ambiente pelo nome mostra loja, faixa em °C, fuso, gráfico em
   30 minutos e a temperatura externa com rótulo próprio. Lacuna não vira
   número. Voltar retorna à rede.
4. Juliana vê só a loja do alcance dela, no mesmo visual.
5. Ana cai na escolha de cliente. Depois do foco, a barra mostra Operador
   Diel, o nome do cliente e Trocar cliente. Sair devolve à entrada, e a
   rede sem sessão não mostra as lojas.
6. Com a API fora do ar, a rede mostra "Não foi possível carregar. Tente de
   novo." e não a página genérica de exceção.

## Suítes

Unitário, API e frontend:

```bash
docker compose run --rm unit-tests
```

E2E da plataforma mais o HTML das telas. Exige `web` no ar e `WEB_BASE_URL`.

```bash
docker compose run --rm e2e-tests
```

Largura e teclado, no perfil de teste:

```bash
docker compose --profile test run --rm ui-tests
```

O resultado esperado das três é suíte verde. O olhar de 10 segundos para
achar a loja fora da faixa fica na observação 2: a exceção é o primeiro
bloco.
