<!--
Sync Impact Report
- Version change: 1.3.0 → 1.4.0
- Bump rationale: MINOR. O limite de 300 linhas deixa de valer para a
  especificação e para a lista de tarefas. A regra de código, teste e
  migration não muda.
- Modified principles:
  - VII. Arquivos e services pequenos (escopo do limite de linhas)
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none
-->

# Constituição Celsius 360 (Diel Energia)

## Core Principles

### I. Testes obrigatórios na stack Docker (NON-NEGOTIABLE)

Toda mudança de comportamento MUST ter teste unitário e teste ponta a ponta.
As duas suítes MUST rodar na stack Docker do repositório. Teste que dependa de
serviço instalado só na máquina do desenvolvedor MUST NOT ser aceito.

O teste unitário MUST cobrir regra de domínio sem rede: desmembramento de
amostras, faixa de conforto, expediente, descarte de anomalia, status do
dispositivo e decisão de backpressure.

O teste e2e MUST subir a stack e provar o caminho afetado por fora do
processo, via MQTT, HTTP, WebSocket ou interface. Quando a mudança for de
tela, a stack MUST incluir o frontend.

Uma tarefa MUST NOT ser dada como concluída sem as duas suítes verdes no
Docker.

### II. Isolamento da ingestão (Bulkhead)

O `ingestion-worker` MUST ser um processo separado do `api-server`.
O caminho de escrita MQTT MUST NOT compartilhar event loop, pool de escrita
em lote nem ciclo de vida do processo que atende REST e WebSocket.

Réplicas do worker e da API MUST escalar de forma independente. Saturação ou
falha da ingestão MUST NOT impedir a API de responder leituras já persistidas.

### III. Lago bruto desacoplado do banco analítico

Todo pacote MQTT aceito MUST ser persistido cru, compactado com GZIP, no
object storage, no bucket `diel-raw-telemetry`, na partição
`dt=YYYY-MM-DD/hour=HH/`. A série tratada MUST ser gravada no TimescaleDB.

A API de painel MUST consultar séries, agregados e estado atual no
TimescaleDB e no Redis. O object storage MUST NOT ser o caminho de leitura
das telas operacionais. Listar lotes crus é um endpoint próprio.

Consulta de série de um ambiente, em janela de até 30 dias, MUST responder em
menos de 100 ms no banco, usando hypertable, continuous aggregate ou
`time_bucket_gapfill`, conforme a granularidade. A listagem da rede MUST usar
a continuous aggregate horária e o estado desnormalizado em `environments`,
com meta de menos de 30 ms.

### IV. Node.js orquestra; TimescaleDB analisa

`ingestion-worker`, `api-server` e o frontend MUST ser TypeScript. A API MUST
usar NestJS com Fastify. O frontend MUST usar Next.js.

Agregação, indexação e compressão de série temporal MUST permanecer no
TimescaleDB. Roteamento MQTT MUST permanecer no broker. O arquivo bruto MUST
permanecer no MinIO. O Node MUST atuar como orquestrador de I/O e validador
de domínio.

No `ingestion-worker`, parse, unrolling e cálculo de conforto em JavaScript
MUST rodar em pool de `worker_threads`. `zlib.gzip` MUST rodar fora do event
loop, no thread pool da libuv. O event loop lag MUST permanecer abaixo de
5 ms sob a carga de projeto.

Reescrever somente o `ingestion-worker` em outro runtime é permitido quando o
volume deixar de caber neste desenho. A troca MUST preservar os contratos do
broker, do object storage, do TimescaleDB e da API.

### V. Multi-tenant, RBAC e observabilidade

Toda leitura de loja ou ambiente MUST ser filtrada pelo perfil, pelo
`client_id` e por `allowed_store_ids` quando o perfil não for global. O
frontend MUST NOT ser a única barreira de autorização.

O status do dispositivo MUST ser calculado contra o relógio virtual
`system:virtual_now` no Redis, não contra o relógio de parede: ONLINE até
15 min, OFFLINE acima de 15 min, SEM_DADOS quando `last_seen_at` é nulo.

Leitura fora de -10 °C a +60 °C MUST ser descartada da série tratada e
registrada em `telemetry_anomalies`.

`ingestion-worker` e `api-server` MUST expor `/metrics` para o Prometheus e
logs JSON via Pino. A stack MUST incluir Loki e Grafana.

### VI. Interface em português, código em inglês

Texto que a pessoa vê no frontend MUST estar em português do Brasil: rótulos,
mensagens, estados vazios e erros exibidos na tela.

Código MUST estar em inglês: nomes de arquivo, identificadores, comentários,
logs, paths, campos de JSON e códigos de erro. A API MUST devolver código de
erro em inglês. A frase exibida na tela MUST ser montada no frontend, em
português.

### VII. Arquivos e services pequenos

Código de aplicação, teste e migration MUST NOT passar de 300 linhas. A
contagem inclui linha em branco e comentário. Lockfile, arquivo gerado,
snapshot de ferramenta, especificação (`specs/**/spec.md`) e lista de tarefas
(`specs/**/tasks.md`) ficam de fora. Esses dois documentos MUST NOT ser
partidos por causa do limite. Migration que passaria de 300 linhas MUST ser
quebrada em migrations sequenciais.

Um service MUST ter um único caso de uso. Service que passa a ter um segundo
motivo para mudar, ou cujo arquivo se aproxima do limite, MUST ser dividido
antes do merge. Controller MUST NOT concentrar regra de negócio que pertence
a um service.

### VIII. Migrations, models e repositories

Toda mudança de schema MUST entrar como migration versionada e MUST rodar na
subida da stack Docker. Hypertable, continuous aggregate, política de
compressão e índice MUST nascer em migration. SQL aplicado à mão no banco
MUST NOT ser o caminho de evolução do schema.

Cada tabela ou hypertable lida ou escrita pela aplicação MUST ter um model.
Toda query MUST viver em um repository. Service, controller e gateway MUST
NOT abrir cliente de banco nem escrever SQL. O repository MUST receber e
devolver models, não linha crua do driver.

### IX. ACK só depois da durabilidade

O worker MUST enviar PUBACK somente depois que o lote cru correspondente
estiver gravado no MinIO e o upsert das amostras tratadas tiver sido
confirmado no TimescaleDB. Se um dos dois falhar, o worker MUST reter o
PUBACK para o broker manter a mensagem em QoS 1.

### X. Ingestão idempotente

Reprocessar o mesmo pacote MUST NOT duplicar amostra. Para a mesma chave
`(environment_id, sample_time)`, a segunda gravação da mesma entrada MUST
produzir a mesma temperatura, o mesmo expediente e o mesmo conforto já
persistidos. O upsert MUST ser determinístico para a mesma entrada.

### XI. Regra de negócio só no backend

Conforto, expediente, status do dispositivo e filtro de RBAC MUST ser
calculados no backend. O frontend MUST exibir o valor devolvido pela API. O
frontend MUST NOT recalcular faixa térmica, horário de expediente nem
autorização para decidir o que mostrar.

### XII. Instante em UTC, expediente no fuso da loja

Todo timestamp persistido MUST ser UTC (`timestamptz`). A avaliação de
`operating_hours` MUST usar o `timezone` da loja. Expediente comparado com o
relógio de parede do servidor ou com o fuso do browser MUST NOT ser o
caminho da regra.

### XIII. Segredos fora do repositório

Senha, segredo de JWT e credencial de Postgres, MQTT e MinIO MUST entrar só
por variável de ambiente da stack Docker. Valor real MUST NOT aparecer em
código, migration, compose, log, métrica ou teste versionado. Arquivo de
exemplo MUST usar placeholder. Log MUST NOT imprimir segredo, token nem
e-mail.

### XIV. Variável nova entra no .env.example

Toda variável de ambiente lida pela aplicação ou pelo Docker Compose MUST
estar no `.env.example` da raiz do repositório. Variável criada MUST entrar
nesse arquivo na mesma alteração que passa a lê-la. Variável que deixa de
ser lida MUST sair dele na mesma alteração.

Cada entrada MUST ter o nome e um placeholder. Valor real MUST NOT aparecer
no `.env.example`. O arquivo `.env` local MUST NOT ser commitado.

## Stack e restrições de plataforma

A stack Docker Compose é o ambiente oficial de desenvolvimento, teste
unitário, teste e2e e demonstração local. Serviço obrigatório fora dessa
stack MUST NOT entrar sem emenda desta constituição.

Componentes ratificados:

- Simulador MQTT a partir de `telemetrias.jsonl`, com taxa ajustável.
- Broker MQTT com shared subscriptions e QoS 1. EMQX é o broker da stack.
  Outro broker só entra se preservar esse contrato.
- `ingestion-worker`: consome MQTT, faz unrolling, grava o lote cru no MinIO
  e faz bulk upsert no TimescaleDB.
- `api-server`: REST e WebSocket. Não consome o broker MQTT.
- Frontend Next.js: visão da rede e detalhe do ambiente, com a identidade
  visual institucional Diel Energia.
- PostgreSQL com TimescaleDB para cadastro, RBAC e séries tratadas.
- MinIO compatível com S3 para o data lake bruto.
- Redis para relógio virtual, metadados quentes e pub/sub do WebSocket.
- Prometheus, Grafana Loki e Grafana.

Política de escrita ratificada, até emenda:

- Flush do lote cru aos 5.000 pacotes ou 5 segundos, em objeto `.jsonl.gz`.
- Bulk upsert da série aos 2.000 amostras ou 1 segundo, com conflito em
  `(environment_id, sample_time)`.
- Backpressure: no limite do buffer, o worker MUST reter o PUBACK para o
  broker guardar as mensagens em QoS 1.

Schema físico, payloads, fórmulas e desenho de tela vivem na especificação.
A especificação MUST permanecer compatível com estes componentes e com estas
políticas.

## Fluxo de desenvolvimento e quality gates

Cada funcionalidade MUST passar por especificação, plano, tarefas e
implementação. O plano MUST citar os princípios desta constituição que a
mudança toca.

Gate de merge:

1. Testes unitários novos ou atualizados cobrem a regra alterada.
2. Testes e2e novos ou atualizados cobrem o caminho alterado, no Docker
   Compose.
3. As duas suítes estão verdes na mesma definição de stack do repositório.
4. Log da mudança é JSON. Métrica nova entra em `/metrics` quando a mudança
   altera ingestão, API ou latência.
5. Nenhuma query de painel varre o object storage para montar série temporal.
6. Código de aplicação, teste e migration não passam de 300 linhas.
   Especificação e lista de tarefas ficam fora desse limite. Nenhum service
   junta mais de um caso de uso.
7. Mudança de schema entra com migration. Acesso ao banco passa por model e
   repository.
8. Texto de tela está em português do Brasil. Código, log e código de erro
   estão em inglês.
9. Um teste e2e mostra que usuário de um cliente não lê loja de outro.
10. Nenhum segredo real está no diff. Log novo não imprime segredo, token
    nem e-mail.
11. Variável de ambiente criada ou removida está refletida no `.env.example`
    da mesma alteração, só com placeholder.

Novo serviço, novo banco, novo runtime ou dependência que contorne
TimescaleDB, MinIO ou o broker MUST ser justificado no plano. Se contrariar
um princípio, MUST esperar emenda desta constituição.

## Governance

Esta constituição prevalece sobre especificações, planos e tarefas em caso de
conflito. Especificação que quebre um princípio MUST NOT ser implementada. O
caminho é emendar a constituição antes.

Emenda exige descrição da mudança, motivo, impacto nos serviços e plano de
migração quando houver dado ou contrato já persistido. A versão segue SemVer:

- MAJOR: remoção ou redefinição incompatível de um princípio.
- MINOR: princípio ou seção nova, ou expansão material de uma regra.
- PATCH: redação ou esclarecimento sem mudança de regra.

Revisão de pull request MUST verificar os princípios tocados pela mudança e o
gate de testes Docker. A data de ratificação é a da versão 1.0.0. Last
Amended muda a cada emenda.

**Version**: 1.4.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
