SELECT remove_continuous_aggregate_policy('cagg_environment_hourly', if_exists => true);

SELECT add_continuous_aggregate_policy(
    'cagg_environment_hourly',
    start_offset => NULL,
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes'
);

CALL refresh_continuous_aggregate(
    'cagg_environment_hourly',
    '2026-01-01',
    '2026-03-01'
);
