SELECT remove_continuous_aggregate_policy('cagg_environment_hourly', if_exists => true);

DROP MATERIALIZED VIEW cagg_environment_hourly;

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
    AVG(temperature) FILTER (WHERE is_operating_hours) AS operating_avg_temp,
    MIN(temperature) FILTER (WHERE is_operating_hours) AS operating_min_temp,
    MAX(temperature) FILTER (WHERE is_operating_hours) AS operating_max_temp,
    COUNT(*) FILTER (WHERE is_delayed_packet = TRUE) AS delayed_samples
FROM telemetry_samples
GROUP BY bucket_hour, store_id, environment_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'cagg_environment_hourly',
    start_offset => NULL,
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes'
);

CALL refresh_continuous_aggregate('cagg_environment_hourly', NULL, NULL);
