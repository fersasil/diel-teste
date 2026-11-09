# 5. Regras de negócio e enriquecimento

## 5.1. Relógio virtual ("agora")

Chave `system:virtual_now` no Redis, correspondente ao `MAX(sample_time)`
processado pelo `ingestion-worker`.

## 5.2. Desmembramento (unrolling)

Para cada pacote com N leituras e intervalo Δt:

T(i) = T(utc) − (N − 1 − i) × Δt

## 5.3. Higienização e pacotes atrasados (`saved_data`)

Leituras fora de [−10 °C, +60 °C] são descartadas da série tratada e
registradas em `telemetry_anomalies`.

Pacotes `saved_data` são inseridos no instante histórico correto. As
continuous aggregates recalculam sozinhas.

## 5.4. Expediente e conforto térmico

A verificação usa o fuso horário da loja e as regras de `operating_hours` do
ambiente. O percentual é o tempo dentro da faixa dividido pelo tempo de
expediente do período. Cada amostra dentro da faixa cobre 30 segundos. O
expediente sem amostra entra só no denominador.

## 5.5. Status do dispositivo e do ambiente

- ONLINE: `virtual_now − last_seen_at ≤ 15 min`
- OFFLINE: `virtual_now − last_seen_at > 15 min`
- SEM_DADOS: `last_seen_at` é nulo

# 7. Observabilidade (Prometheus + Loki + Grafana)

Prometheus coleta `/metrics` do `ingestion-worker` e do `api-server`: fila da
stream, pacotes confirmados, lotes rejeitados e respostas 5xx.

O Promtail envia o log dos containers ao Loki. O Grafana sobe com Prometheus,
Loki e TimescaleDB, e o painel Ingestão.

# 8. API (`api-server`) e frontend (Next.js)

## 8.1. Endpoints principais

- `POST /api/v1/auth/login`
- `GET /api/v1/stores` (paginada, filtrada por RBAC)
- `GET /api/v1/environments/:id/summary`
- `GET /api/v1/environments/:id/timeseries` (gapfill adaptativo)
- `GET /api/v1/storage/raw-batches`

## 8.2. Frontend

Identidade visual institucional Diel Energia.

Seletor rápido de persona na barra superior.

Tela 1: visão da rede.

Tela 2: detalhe do ambiente, com gráficos interativos.
