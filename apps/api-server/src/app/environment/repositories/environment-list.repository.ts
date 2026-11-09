import { getPool } from "../../../infra/database/pg-pool";
import type { ComfortStatus } from "../../../shared/models/cadastro";

export type EnvironmentListSort = "store" | "environment" | "comfort" | "device";

export interface EnvironmentListRow {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  lastComfortStatus: ComfortStatus | null;
  lastSeenAt: Date | null;
  operatingSeconds: number;
  inRangeSeconds: number;
  outOfRangeEnvCount: number;
}

export class EnvironmentListRepository {
  async list(input: {
    clientId: string;
    storeId?: string;
    environmentName?: string;
    comfortStatus?: ComfortStatus | "NO_DATA";
    deviceStatus?: "ONLINE" | "OFFLINE" | "NO_DATA";
    allowedStoreIds: string[] | null;
    sort?: EnvironmentListSort;
    dir?: "asc" | "desc";
    virtualNow?: Date;
    from: Date;
    to: Date;
    limit: number;
    offset: number;
  }): Promise<{ items: EnvironmentListRow[]; total: number }> {
    const pool = getPool();
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId];
    if (input.storeId) {
      values.push(input.storeId);
      filters.push(`e.store_id = $${values.length}`);
    }
    if (input.environmentName) {
      values.push(input.environmentName);
      filters.push(`e.name = $${values.length}`);
    }
    if (input.comfortStatus === "NO_DATA") {
      filters.push("e.last_seen_at IS NULL");
    } else if (input.comfortStatus) {
      values.push(input.comfortStatus);
      filters.push(`e.last_seen_at IS NOT NULL AND e.last_comfort_status = $${values.length}`);
    }
    if (input.deviceStatus === "NO_DATA") {
      filters.push("e.last_seen_at IS NULL");
    } else if (input.deviceStatus) {
      values.push(input.virtualNow ?? new Date());
      const online = `$${values.length}::timestamptz - e.last_seen_at <= INTERVAL '15 minutes'`;
      filters.push(input.deviceStatus === "ONLINE"
        ? `e.last_seen_at IS NOT NULL AND ${online}`
        : `e.last_seen_at IS NOT NULL AND NOT (${online})`);
    }
    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }
    const where = filters.join(" AND ");
    const count = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM environments e
       JOIN stores s ON s.id = e.store_id
       WHERE ${where}`,
      values,
    );
    const fromIndex = values.push(input.from);
    const toIndex = values.push(input.to);
    const order = orderSql(input.sort, input.dir === "desc" ? "DESC" : "ASC", values, input.virtualNow);
    values.push(input.limit, input.offset);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;
    const rows = await pool.query(
      `SELECT e.id, e.name, e.store_id, s.name AS store_name,
              e.last_comfort_status, e.last_seen_at,
              operating_seconds(e.operating_hours, s.timezone, $${fromIndex}::timestamptz, $${toIndex}::timestamptz) AS operating_seconds,
              COALESCE(period.comfort_samples, 0)::float8 * 30 AS in_range_seconds,
              COALESCE(outside.out_of_range_envs, 0)::int AS out_of_range_envs
       FROM environments e
       JOIN stores s ON s.id = e.store_id
       LEFT JOIN (
         SELECT c.environment_id,
                SUM(c.comfort_samples)::int AS comfort_samples
         FROM cagg_environment_hourly c
         JOIN stores scoped ON scoped.id = c.store_id AND scoped.client_id = $1
         WHERE c.bucket_hour >= $${fromIndex}::timestamptz AND c.bucket_hour < $${toIndex}::timestamptz
         GROUP BY c.environment_id
       ) period ON period.environment_id = e.id
       LEFT JOIN (
         SELECT grouped.store_id, COUNT(*)::int AS out_of_range_envs
         FROM (
           SELECT c.store_id, c.environment_id
           FROM cagg_environment_hourly c
           JOIN stores scoped ON scoped.id = c.store_id AND scoped.client_id = $1
           WHERE c.bucket_hour >= $${fromIndex}::timestamptz AND c.bucket_hour < $${toIndex}::timestamptz
           GROUP BY c.store_id, c.environment_id
           HAVING SUM(c.above_samples) + SUM(c.below_samples) > 0
         ) grouped
         GROUP BY grouped.store_id
       ) outside ON outside.store_id = e.store_id
       WHERE ${where}
       ORDER BY ${order}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );
    return {
      total: Number(count.rows[0]?.total ?? 0),
      items: rows.rows.map((row) => ({
        id: row.id,
        name: row.name,
        storeId: row.store_id,
        storeName: row.store_name,
        lastComfortStatus: row.last_comfort_status,
        lastSeenAt: row.last_seen_at,
        operatingSeconds: Number(row.operating_seconds),
        inRangeSeconds: Number(row.in_range_seconds),
        outOfRangeEnvCount: row.out_of_range_envs,
      })),
    };
  }

  async distinctNames(input: {
    clientId: string;
    storeId?: string;
    allowedStoreIds: string[] | null;
    query?: string;
    selectedName?: string;
    limit: number;
  }): Promise<string[]> {
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId];
    if (input.storeId) {
      values.push(input.storeId);
      filters.push(`e.store_id = $${values.length}`);
    }
    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }
    if (input.query) {
      values.push(input.query);
      filters.push(`e.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\'`);
    }
    values.push(input.limit);
    const rows = await getPool().query<{ name: string }>(
      `SELECT DISTINCT e.name
       FROM environments e
       JOIN stores s ON s.id = e.store_id
       WHERE ${filters.join(" AND ")}
       ORDER BY e.name
       LIMIT $${values.length}`,
      values,
    );
    const names = rows.rows.map((row) => row.name);
    if (input.selectedName && !names.includes(input.selectedName)) {
      names.unshift(input.selectedName);
    }
    return names;
  }
}

function orderSql(
  sort: EnvironmentListSort | undefined,
  dir: "ASC" | "DESC",
  values: unknown[],
  virtualNow?: Date,
): string {
  if (sort === "store") {
    return `s.name ${dir}, e.name ASC`;
  }
  if (sort === "environment") {
    return `e.name ${dir}, s.name ASC`;
  }
  if (sort === "comfort") {
    return `CASE
              WHEN e.last_seen_at IS NULL THEN 3
              WHEN e.last_comfort_status = 'ABOVE' THEN 0
              WHEN e.last_comfort_status = 'BELOW' THEN 1
              WHEN e.last_comfort_status = 'IN_RANGE' THEN 2
              ELSE 3
            END ${dir}, s.name ASC, e.name ASC`;
  }
  if (sort === "device") {
    values.push(virtualNow ?? new Date());
    return `CASE
              WHEN e.last_seen_at IS NULL THEN 2
              WHEN $${values.length}::timestamptz - e.last_seen_at <= INTERVAL '15 minutes' THEN 0
              ELSE 1
            END ${dir}, s.name ASC, e.name ASC`;
  }
  return `CASE
            WHEN e.last_seen_at IS NOT NULL AND e.last_comfort_status IN ('ABOVE', 'BELOW') THEN 0
            ELSE 1
          END ASC, s.name ASC, e.name ASC`;
}
