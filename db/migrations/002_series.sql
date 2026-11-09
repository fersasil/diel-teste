CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE telemetry_samples (
    sample_time TIMESTAMPTZ NOT NULL,
    environment_id VARCHAR(20) NOT NULL REFERENCES environments (id),
    store_id VARCHAR(20) NOT NULL,
    dev_id VARCHAR(20) NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    is_operating_hours BOOLEAN NOT NULL,
    comfort_status VARCHAR(15) NOT NULL,
    is_delayed_packet BOOLEAN NOT NULL DEFAULT FALSE,
    raw_batch_key VARCHAR(255),
    CONSTRAINT uq_env_sample_time UNIQUE (environment_id, sample_time),
    CONSTRAINT telemetry_samples_temp_range CHECK (
        temperature >= -10 AND temperature <= 60
    ),
    CONSTRAINT telemetry_samples_comfort CHECK (
        comfort_status IN ('IN_RANGE', 'ABOVE', 'BELOW')
    )
);
SELECT create_hypertable(
    'telemetry_samples',
    'sample_time',
    chunk_time_interval => INTERVAL '7 days'
);

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
    COUNT(*) FILTER (
        WHERE is_operating_hours = TRUE AND comfort_status = 'IN_RANGE'
    ) AS comfort_samples,
    COUNT(*) FILTER (
        WHERE is_operating_hours = TRUE AND comfort_status = 'ABOVE'
    ) AS above_samples,
    COUNT(*) FILTER (
        WHERE is_operating_hours = TRUE AND comfort_status = 'BELOW'
    ) AS below_samples,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    COUNT(*) FILTER (WHERE is_delayed_packet = TRUE) AS delayed_samples
FROM telemetry_samples
GROUP BY bucket_hour, store_id, environment_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'cagg_environment_hourly',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes'
);

CREATE TABLE external_weather (
    reading_time TIMESTAMPTZ NOT NULL,
    store_id VARCHAR(20) NOT NULL REFERENCES stores (id),
    city VARCHAR(100) NOT NULL,
    external_temp DOUBLE PRECISION NOT NULL,
    CONSTRAINT uq_store_weather_time UNIQUE (store_id, reading_time)
);
SELECT create_hypertable(
    'external_weather',
    'reading_time',
    chunk_time_interval => INTERVAL '30 days'
);

CREATE TABLE telemetry_anomalies (
    detected_at TIMESTAMPTZ NOT NULL,
    dev_id VARCHAR(20) NOT NULL,
    environment_id VARCHAR(20),
    raw_value DOUBLE PRECISION,
    reason VARCHAR(50) NOT NULL,
    raw_batch_key VARCHAR(255)
);
SELECT create_hypertable(
    'telemetry_anomalies',
    'detected_at',
    chunk_time_interval => INTERVAL '7 days'
);
