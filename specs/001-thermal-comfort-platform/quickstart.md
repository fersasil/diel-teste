# Quickstart de validação

Guia para provar o comportamento depois da implementação. Não contém o
código dos services. Contratos em [contracts/](./contracts/). Dados em
[data-model.md](./data-model.md).

## Pré-requisitos

Docker Compose. Copiar `.env.example` para `.env` e preencher por fora do
Git. A subida aplica as migrations e sobe broker, worker, API, frontend,
TimescaleDB, MinIO, Redis, Prometheus, Loki e Grafana.

Dois clientes de fixture, A e B. Cada um com lojas e ambientes. Usuários:
gestor de A, gerente de uma loja de A, operador Diel, gestor de B.

## Subir e testar

Na raiz do repositório:

```bash
docker compose up --wait
docker compose run --rm unit-tests
docker compose run --rm e2e-tests
```

As duas suítes precisam terminar verdes dentro do Compose. Teste apontando
para Postgres ou MQTT instalado só na máquina não conta.

## Cenários que o e2e precisa mostrar

1. Login inválido não abre sessão e a frase na tela está em português.
2. Gestor de A vê contagens por loja e nenhuma loja de B. A listagem de
   centenas de lojas responde em menos de 30 ms no banco.
3. Gerente restrito a uma loja só vê essa loja.
4. Operador sem foco recebe lista vazia. Com foco em A, não vê loja de B.
5. Publicar um pacote QoS 1 grava amostras e um `.jsonl.gz`. Derrubar um
   dos dois destinos retém o PUBACK.
6. Reenviar o mesmo pacote deixa uma linha por ambiente e instante.
7. Leitura de 80 °C vira anomalia e não entra na série. Leitura de 60 °C
   entra.
8. Pacote atrasado aparece na hora histórica, não na hora de chegada.
9. Detalhe abre em balde de 30 minutos, aceita `15m` e `1h`, e mostra
   lacuna sem inventar temperatura. Janela acima de 30 dias é rejeitada.
   A série de 30 dias responde em menos de 100 ms no banco.
10. Clima externo ausente não falha o detalhe.
11. Gerente que pede lotes crus recebe `FORBIDDEN`. Gestor de A vê o lote
    do próprio dia.
12. Uma rajada no worker não impede o gestor, já autenticado, de abrir a
    visão da rede.
13. Texto visível das duas telas está em português. Log do cenário não
    contém senha, token nem e-mail.

## Fora deste guia

Implementação de service, migration completa e suíte pronta ficam para
`tasks.md` e para a fase de implementação.
