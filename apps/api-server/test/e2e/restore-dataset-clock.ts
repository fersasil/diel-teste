import { createClient } from "redis";
import type { Pool } from "pg";

const HORIZON = "2026-03-01";

export async function restoreDatasetClock(pool: Pool): Promise<void> {
  await pool.query("DELETE FROM telemetry_samples WHERE sample_time >= $1::timestamptz", [HORIZON]);
  await pool.query("DELETE FROM telemetry_anomalies WHERE detected_at >= $1::timestamptz", [HORIZON]);
  await pool.query(
    `UPDATE environments AS env
     SET last_seen_at = latest.sample_time,
         last_temp = latest.temperature,
         last_comfort_status = latest.comfort_status,
         is_currently_operating = latest.is_operating_hours
     FROM (
       SELECT DISTINCT ON (environment_id)
         environment_id, sample_time, temperature, comfort_status, is_operating_hours
       FROM telemetry_samples
       ORDER BY environment_id, sample_time DESC
     ) AS latest
     WHERE env.id = latest.environment_id
       AND env.last_seen_at IS DISTINCT FROM latest.sample_time`,
  );
  const clock = await pool.query<{ virtual_now: Date }>(
    `UPDATE virtual_clock
     SET virtual_now = (SELECT MAX(sample_time) FROM telemetry_samples)
     WHERE id = 1
     RETURNING virtual_now`,
  );
  const virtualNow = clock.rows[0]?.virtual_now;
  if (!virtualNow || !process.env.REDIS_URL) {
    return;
  }
  const store = createClient({ url: process.env.REDIS_URL });
  await store.connect();
  await store.set("system:virtual_now", virtualNow.toISOString());
  await store.quit();
}
