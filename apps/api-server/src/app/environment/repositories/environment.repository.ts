import { getPool } from "../../../infra/database/pg-pool";
import type { ComfortStatus } from "../../../shared/models/cadastro";

export interface EnvironmentRow {
  id: string;
  name: string;
  clientId: string;
  storeId: string;
  comfortMin: number;
  comfortMax: number;
  lastTemp: number | null;
  lastComfortStatus: ComfortStatus | null;
  lastSeenAt: Date | null;
  isCurrentlyOperating: boolean;
  storeName: string;
  timezone: string;
}

export class EnvironmentRepository {
  async findScoped(id: string, clientId: string): Promise<EnvironmentRow | null> {
    const result = await getPool().query(
      `SELECT e.id, e.name, s.client_id, e.store_id, e.comfort_min, e.comfort_max,
              e.last_temp, e.last_comfort_status, e.last_seen_at, e.is_currently_operating,
              s.name AS store_name, s.timezone
       FROM environments e
       JOIN stores s ON s.id = e.store_id
       WHERE e.id = $1 AND s.client_id = $2`,
      [id, clientId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      clientId: row.client_id,
      storeId: row.store_id,
      comfortMin: row.comfort_min,
      comfortMax: row.comfort_max,
      lastTemp: row.last_temp,
      lastComfortStatus: row.last_comfort_status,
      lastSeenAt: row.last_seen_at,
      isCurrentlyOperating: row.is_currently_operating,
      storeName: row.store_name,
      timezone: row.timezone,
    };
  }

  async operatingCounts(environmentId: string, from: Date, to: Date): Promise<{
    operatingSeconds: number;
    inRangeSeconds: number;
  }> {
    const result = await getPool().query<{ operating_seconds: number; in_range_seconds: number }>(
      `SELECT
         operating_seconds(e.operating_hours, s.timezone, $2::timestamptz, $3::timestamptz) AS operating_seconds,
         COALESCE((
           SELECT SUM(comfort_samples)
           FROM cagg_environment_hourly
           WHERE environment_id = e.id
             AND bucket_hour >= $2::timestamptz
             AND bucket_hour < $3::timestamptz
         ), 0)::float8 * 30 AS in_range_seconds
       FROM environments e
       JOIN stores s ON s.id = e.store_id
       WHERE e.id = $1`,
      [environmentId, from, to],
    );
    return {
      operatingSeconds: Number(result.rows[0]?.operating_seconds ?? 0),
      inRangeSeconds: Number(result.rows[0]?.in_range_seconds ?? 0),
    };
  }
}
