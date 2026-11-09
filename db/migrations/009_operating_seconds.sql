CREATE OR REPLACE FUNCTION operating_seconds(
    hours JSONB,
    tz TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ
) RETURNS DOUBLE PRECISION
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (LEAST(slot_end, end_at) - GREATEST(slot_start, start_at)))
    ), 0)
    FROM (
        SELECT
            (day_local + start_at_local) AT TIME ZONE tz AS slot_start,
            (day_local + end_at_local) AT TIME ZONE tz AS slot_end
        FROM generate_series(
            ((start_at AT TIME ZONE tz)::date - 1),
            (end_at AT TIME ZONE tz)::date,
            INTERVAL '1 day'
        ) AS day_local
        CROSS JOIN LATERAL (
            SELECT
                (split_part(slot->>0, ':', 1)::int * 60 + split_part(slot->>0, ':', 2)::int) * INTERVAL '1 minute' AS start_at_local,
                (split_part(slot->>1, ':', 1)::int * 60 + split_part(slot->>1, ':', 2)::int) * INTERVAL '1 minute' AS end_at_local
            FROM jsonb_array_elements(
                COALESCE(
                    hours -> (ARRAY['mon','tue','wed','thu','fri','sat','sun'])[EXTRACT(ISODOW FROM day_local)::int],
                    '[]'::jsonb
                )
            ) AS slot
        ) spans
        WHERE end_at_local > start_at_local
    ) slots
    WHERE slot_end > start_at AND slot_start < end_at;
$$;
