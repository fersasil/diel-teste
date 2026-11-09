DELETE FROM telemetry_anomalies AS older
WHERE EXISTS (
    SELECT 1 FROM telemetry_anomalies AS newer
    WHERE newer.dev_id = older.dev_id
      AND newer.detected_at = older.detected_at
      AND newer.reason = older.reason
      AND newer.raw_value IS NOT DISTINCT FROM older.raw_value
      AND newer.tableoid = older.tableoid
      AND newer.ctid < older.ctid
);

CREATE UNIQUE INDEX uq_telemetry_anomaly
    ON telemetry_anomalies (dev_id, detected_at, reason, raw_value);
