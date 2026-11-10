import { getPool } from "../../../infra/database/pg-pool";

export interface IntakeCounts {
  packets: number;
  acceptedReadings: number;
  unknownReadings: number;
  outOfRangeReadings: number;
}

export interface UnknownDeviceRow {
  deviceId: string;
  readings: number;
  lastAt: Date;
  lastValue: number | null;
}

export interface DeviceTrafficRow {
  deviceId: string;
  environmentName: string | null;
  storeName: string | null;
  readings: number;
  recentReadings: number;
}

export class IntakeRepository {
  async summary(): Promise<IntakeCounts> {
    const result = await getPool().query<{
      accepted: string;
      unknown_readings: string;
      out_of_range: string;
      packets: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM telemetry_samples) AS accepted,
         (SELECT COUNT(*) FROM telemetry_anomalies WHERE reason = 'UNKNOWN_DEVICE') AS unknown_readings,
         (SELECT COUNT(*) FROM telemetry_anomalies WHERE reason = 'OUT_OF_RANGE') AS out_of_range,
         (SELECT COALESCE(SUM(packet_count), 0) FROM raw_batches) AS packets`,
    );
    const row = result.rows[0];
    return {
      packets: countOf(row?.packets),
      acceptedReadings: countOf(row?.accepted),
      unknownReadings: countOf(row?.unknown_readings),
      outOfRangeReadings: countOf(row?.out_of_range),
    };
  }

  async unknownDevices(limit: number): Promise<UnknownDeviceRow[]> {
    const result = await getPool().query<{
      dev_id: string;
      readings: number;
      last_at: Date;
      raw_value: number | null;
    }>(
      `SELECT grouped.dev_id, grouped.readings, grouped.last_at, latest.raw_value
       FROM (
         SELECT dev_id, COUNT(*)::int AS readings, MAX(detected_at) AS last_at
         FROM telemetry_anomalies
         WHERE reason = 'UNKNOWN_DEVICE'
         GROUP BY dev_id
       ) grouped
       JOIN LATERAL (
         SELECT raw_value
         FROM telemetry_anomalies recent
         WHERE recent.reason = 'UNKNOWN_DEVICE'
           AND recent.dev_id = grouped.dev_id
         ORDER BY recent.detected_at DESC
         LIMIT 1
       ) latest ON true
       ORDER BY grouped.last_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((row) => ({
      deviceId: row.dev_id,
      readings: Number(row.readings),
      lastAt: row.last_at,
      lastValue: row.raw_value === null ? null : Number(row.raw_value),
    }));
  }

  async devices(): Promise<DeviceTrafficRow[]> {
    const result = await getPool().query<{
      dev_id: string;
      environment_name: string | null;
      store_name: string | null;
      readings: number;
      recent: number;
    }>(
      `WITH clock AS (SELECT virtual_now FROM virtual_clock),
       samples AS (
         SELECT dev_id,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (
                  WHERE sample_time >= (SELECT virtual_now FROM clock) - interval '1 hour'
                )::int AS recent
         FROM telemetry_samples
         GROUP BY dev_id
       ),
       anomalies AS (
         SELECT dev_id,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (
                  WHERE detected_at >= (SELECT virtual_now FROM clock) - interval '1 hour'
                )::int AS recent
         FROM telemetry_anomalies
         GROUP BY dev_id
       )
       SELECT ids.dev_id,
              e.name AS environment_name,
              s.name AS store_name,
              COALESCE(samples.total, 0) + COALESCE(anomalies.total, 0) AS readings,
              COALESCE(samples.recent, 0) + COALESCE(anomalies.recent, 0) AS recent
       FROM (
         SELECT dev_id FROM devices
         UNION
         SELECT dev_id FROM samples
         UNION
         SELECT dev_id FROM anomalies
       ) ids
       LEFT JOIN devices d ON d.dev_id = ids.dev_id
       LEFT JOIN environments e ON e.id = d.environment_id
       LEFT JOIN stores s ON s.id = e.store_id
       LEFT JOIN samples ON samples.dev_id = ids.dev_id
       LEFT JOIN anomalies ON anomalies.dev_id = ids.dev_id
       ORDER BY readings DESC, ids.dev_id`,
    );
    return result.rows.map((row) => ({
      deviceId: row.dev_id,
      environmentName: row.environment_name,
      storeName: row.store_name,
      readings: Number(row.readings),
      recentReadings: Number(row.recent),
    }));
  }
}

function countOf(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
