import { getPool } from "../../../infra/database/pg-pool";

export interface PresenceCounts {
  onlineCount: number;
  offlineCount: number;
}

export class StorePresenceRepository {
  async counts(storeId: string, virtualNow: Date): Promise<PresenceCounts> {
    const result = await getPool().query<{ online_count: number; offline_count: number }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE last_seen_at IS NOT NULL
             AND $2::timestamptz - last_seen_at <= INTERVAL '15 minutes'
         )::int AS online_count,
         COUNT(*) FILTER (
           WHERE last_seen_at IS NOT NULL
             AND $2::timestamptz - last_seen_at > INTERVAL '15 minutes'
         )::int AS offline_count
       FROM environments
       WHERE store_id = $1`,
      [storeId, virtualNow],
    );
    return {
      onlineCount: result.rows[0]?.online_count ?? 0,
      offlineCount: result.rows[0]?.offline_count ?? 0,
    };
  }
}
