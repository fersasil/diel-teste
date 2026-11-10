# 3. Escalabilidade e concorrência

Em produção o cru chega a 20 GB por dia. Ele vai para o objeto, um arquivo
novo por lote. A série tratada fica na hypertable, e o gráfico longo lê o
resumo horário.

## 3.1. Onde o trabalho pesado fica

O processamento de série, índice e agregação fica no TimescaleDB. O
roteamento MQTT fica no EMQX. O pacote cru fica no MinIO. Os serviços em
Node fazem I/O e validam o domínio. O parse e o conforto rodam no event loop do processo.

A escala horizontal é outra réplica do `ingestion-worker`. As duas assinam
`$share/ingestion/diel/telemetry`, então cada pacote chega a um processo só.
Dentro do processo, o lote de até 2.000 pacotes se divide em quatro faixas
pelo hash do dispositivo. O mesmo dispositivo permanece na mesma faixa, e
cada faixa grava as amostras num único `INSERT`.

O `gzip` do lote cru usa o pool nativo da libuv (`UV_THREADPOOL_SIZE=16`).

## 3.2. Lote

O cru é gravado uma vez, compactado, em
`dt=AAAA-MM-DD/hour=HH/client=ID/{id}.jsonl.gz`, perto de 4 MB antes do
gzip. O objeto não é reescrito.

As amostras do lote entram num `INSERT` com `UNNEST`. A chave única é
`(environment_id, sample_time)`. Anomalia repetida não grava de novo.

## 3.3. Leitura

Continuous aggregate `cagg_environment_hourly`: a listagem de centenas de
lojas lê esse resumo, já gravado.

Estado atual desnormalizado (`environments.last_*`): status ONLINE/OFFLINE,
última temperatura e conforto atual ficam nessa tabela, consultados por
índice B-Tree.

Downsampling e gapfill na tela 2: `time_bucket_gapfill()` gera a série com
lacunas visíveis de indisponibilidade.
