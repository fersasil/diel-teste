import { getPool } from "../../../infra/database/pg-pool";

export interface DashboardAlertStore {
  id: string;
  name: string;
  inRangeCount: number;
  aboveCount: number;
  belowCount: number;
  noDataCount: number;
  onlineCount: number;
  offlineCount: number;
}

export interface DashboardTotals {
  storeCount: number;
  environmentCount: number;
  inRange: number;
  above: number;
  below: number;
  noData: number;
  online: number;
  offline: number;
  alertCount: number;
}

export class StoreDashboardRepository {
  async totals(input: {
    clientId: string;
    allowedStoreIds: string[] | null;
    virtualNow: Date;
  }): Promise<DashboardTotals> {
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId, input.virtualNow];

    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }

    const row = await getPool().query(
      `SELECT COUNT(DISTINCT s.id)::int AS store_count,
              COUNT(e.id)::int AS environment_count,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'IN_RANGE'
              )::int AS in_range,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'ABOVE'
              )::int AS above,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'BELOW'
              )::int AS below,
              COUNT(*) FILTER (WHERE e.id IS NOT NULL AND e.last_seen_at IS NULL)::int AS no_data,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL
                  AND $2::timestamptz - e.last_seen_at <= INTERVAL '15 minutes'
              )::int AS online,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL
                  AND $2::timestamptz - e.last_seen_at > INTERVAL '15 minutes'
              )::int AS offline,
              COUNT(DISTINCT s.id) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status IN ('ABOVE', 'BELOW')
              )::int AS alert_count
       FROM stores s
       LEFT JOIN environments e ON e.store_id = s.id
       WHERE ${filters.join(" AND ")}`,
      values,
    );
    const item = row.rows[0];
    return {
      storeCount: item?.store_count ?? 0,
      environmentCount: item?.environment_count ?? 0,
      inRange: item?.in_range ?? 0,
      above: item?.above ?? 0,
      below: item?.below ?? 0,
      noData: item?.no_data ?? 0,
      online: item?.online ?? 0,
      offline: item?.offline ?? 0,
      alertCount: item?.alert_count ?? 0,
    };
  }

  async alerts(input: {
    clientId: string;
    allowedStoreIds: string[] | null;
    virtualNow: Date;
    limit: number;
  }): Promise<DashboardAlertStore[]> {
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId, input.virtualNow];

    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }

    values.push(input.limit);
    const rows = await getPool().query(
      `SELECT s.id, s.name,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'IN_RANGE'
              )::int AS in_range_count,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'ABOVE'
              )::int AS above_count,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status = 'BELOW'
              )::int AS below_count,
              COUNT(*) FILTER (WHERE e.id IS NOT NULL AND e.last_seen_at IS NULL)::int AS no_data_count,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL
                  AND $2::timestamptz - e.last_seen_at <= INTERVAL '15 minutes'
              )::int AS online_count,
              COUNT(*) FILTER (
                WHERE e.last_seen_at IS NOT NULL
                  AND $2::timestamptz - e.last_seen_at > INTERVAL '15 minutes'
              )::int AS offline_count
       FROM stores s
       LEFT JOIN environments e ON e.store_id = s.id
       WHERE ${filters.join(" AND ")}
       GROUP BY s.id
       HAVING COUNT(*) FILTER (
         WHERE e.last_seen_at IS NOT NULL AND e.last_comfort_status IN ('ABOVE', 'BELOW')
       ) > 0
       ORDER BY s.name
       LIMIT $${values.length}`,
      values,
    );
    return rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      inRangeCount: row.in_range_count,
      aboveCount: row.above_count,
      belowCount: row.below_count,
      noDataCount: row.no_data_count,
      onlineCount: row.online_count,
      offlineCount: row.offline_count,
    }));
  }
}
