# 4. Modelagem de dados

## 4.1. Particionamento no MinIO (S3)

```text
s3://diel-raw-telemetry/
 └── dt=2026-02-10/
      └── hour=23/
           └── client=CLI-001/
                └── {id}.jsonl.gz
```

## 4.2. Schema PostgreSQL + TimescaleDB

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE clients (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    segment VARCHAR(50) NOT NULL
);

CREATE TABLE stores (
    id VARCHAR(20) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    operating_hours JSONB NOT NULL
);
CREATE INDEX idx_stores_client_city ON stores(client_id, city);

CREATE TABLE environments (
    id VARCHAR(20) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL REFERENCES stores(id),
    name VARCHAR(100) NOT NULL,
    comfort_min DOUBLE PRECISION NOT NULL,
    comfort_max DOUBLE PRECISION NOT NULL,
    operating_hours JSONB NOT NULL,
    dev_id VARCHAR(20) UNIQUE NOT NULL,
    last_seen_at TIMESTAMPTZ,
    last_temp DOUBLE PRECISION,
    last_comfort_status VARCHAR(15),
    is_currently_operating BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_environments_store ON environments(store_id);

CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    profile VARCHAR(30) NOT NULL,
    client_id VARCHAR(20) REFERENCES clients(id),
    allowed_store_ids TEXT[]
);

CREATE TABLE telemetry_samples (
    sample_time TIMESTAMPTZ NOT NULL,
    environment_id VARCHAR(20) NOT NULL REFERENCES environments(id),
    store_id VARCHAR(20) NOT NULL,
    dev_id VARCHAR(20) NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    is_operating_hours BOOLEAN NOT NULL,
    comfort_status VARCHAR(15) NOT NULL,
    is_delayed_packet BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_env_sample_time UNIQUE (environment_id, sample_time)
);
SELECT create_hypertable('telemetry_samples', 'sample_time', chunk_time_interval => INTERVAL '7 days');

ALTER TABLE telemetry_samples SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'environment_id, store_id',
    timescaledb.compress_orderby = 'sample_time DESC'
);
SELECT add_compression_policy('telemetry_samples', INTERVAL '7 days');

CREATE MATERIALIZED VIEW cagg_environment_hourly
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT
    time_bucket('1 hour', sample_time) AS bucket_hour,
    store_id,
    environment_id,
    COUNT(*) AS total_samples,
    COUNT(*) FILTER (WHERE is_operating_hours = TRUE) AS operating_samples,
    COUNT(*) FILTER (WHERE is_operating_hours = TRUE AND comfort_status = 'IN_RANGE') AS comfort_samples,
    COUNT(*) FILTER (WHERE is_operating_hours = TRUE AND comfort_status = 'ABOVE') AS above_samples,
    COUNT(*) FILTER (WHERE is_operating_hours = TRUE AND comfort_status = 'BELOW') AS below_samples,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    COUNT(*) FILTER (WHERE is_delayed_packet = TRUE) AS delayed_samples
FROM telemetry_samples
GROUP BY bucket_hour, store_id, environment_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('cagg_environment_hourly',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes');

CREATE TABLE external_weather (
    reading_time TIMESTAMPTZ NOT NULL,
    store_id VARCHAR(20) NOT NULL REFERENCES stores(id),
    city VARCHAR(100) NOT NULL,
    external_temp DOUBLE PRECISION NOT NULL,
    CONSTRAINT uq_store_weather_time UNIQUE (store_id, reading_time)
);
SELECT create_hypertable('external_weather', 'reading_time', chunk_time_interval => INTERVAL '30 days');

CREATE TABLE telemetry_anomalies (
    detected_at TIMESTAMPTZ NOT NULL,
    dev_id VARCHAR(20) NOT NULL,
    environment_id VARCHAR(20),
    raw_value DOUBLE PRECISION,
    reason VARCHAR(50) NOT NULL,
    s3_batch_key VARCHAR(255)
);
SELECT create_hypertable('telemetry_anomalies', 'detected_at', chunk_time_interval => INTERVAL '7 days');
```

## 6. Consulta de série com gapfill

```sql
SELECT
    time_bucket_gapfill('30 minutes', s.sample_time, $2::timestamptz, $3::timestamptz) AS bucket,
    ROUND(AVG(s.temperature)::numeric, 2) AS avg_temp,
    MIN(s.temperature) AS min_temp,
    MAX(s.temperature) AS max_temp,
    BOOL_OR(s.is_operating_hours) AS is_operating
FROM telemetry_samples s
WHERE s.environment_id = $1
  AND s.sample_time >= $2::timestamptz
  AND s.sample_time <= $3::timestamptz
GROUP BY bucket
ORDER BY bucket ASC;
```
