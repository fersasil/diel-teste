CREATE TABLE virtual_clock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  virtual_now TIMESTAMPTZ NOT NULL
);

INSERT INTO virtual_clock (id, virtual_now)
SELECT 1, MAX(sample_time)
FROM telemetry_samples
HAVING MAX(sample_time) IS NOT NULL;
