import { getPool } from "../../../infra/database/pg-pool";
import type { ComfortStatus } from "../../../shared/models/cadastro";

export type StoreListSort = "store" | "comfort" | "outOfRange" | "device";

export interface StoreListRow {
  id: string;
  name: string;
  city: string;
  uf: string;
  inRangeCount: number;
  aboveCount: number;
  belowCount: number;
  noDataCount: number;
  onlineCount: number;
  offlineCount: number;
  operatingSeconds: number;
  inRangeSeconds: number;
  outOfRangeEnvCount: number;
  environments: Array<{
    id: string;
    name: string;
    comfortStatus: "IN_RANGE" | "ABOVE" | "BELOW" | "NO_DATA" | null;
    deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
  }>;
}

export class StoreListRepository {
  async list(input: {
    clientId: string;
    allowedStoreIds: string[] | null;
    query?: string;
    storeId?: string;
    environmentName?: string;
    comfortStatus?: ComfortStatus | "NO_DATA";
    sort?: StoreListSort;
    dir?: "asc" | "desc";
    from: Date;
    to: Date;
    limit: number;
    offset: number;
    virtualNow: Date;
  }): Promise<{ items: StoreListRow[]; total: number }> {
    const pool = getPool();
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId, input.virtualNow, input.from, input.to];

    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }

    if (input.storeId) {
      values.push(input.storeId);
      filters.push(`s.id = $${values.length}`);
    }

    if (input.query) {
      values.push(input.query);
      filters.push(`s.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\'`);
    }

    let envNameIndex = 0;

    if (input.environmentName) {
      values.push(input.environmentName);
      envNameIndex = values.length;
      filters.push(`EXISTS (SELECT 1 FROM environments ex WHERE ex.store_id = s.id AND ex.name = $${envNameIndex})`);
    }

    if (input.comfortStatus === "NO_DATA") {
      filters.push("e.last_seen_at IS NULL");
    } else if (input.comfortStatus) {
      values.push(input.comfortStatus);
      filters.push(`e.last_seen_at IS NOT NULL AND e.last_comfort_status = $${values.length}`);
    }

    const where = filters.join(" AND ");
    const countValues: unknown[] = [input.clientId];
    const countFilters = ["s.client_id = $1"];

    if (input.allowedStoreIds) {
      countValues.push(input.allowedStoreIds);
      countFilters.push(`s.id = ANY($${countValues.length}::text[])`);
    }

    if (input.storeId) {
      countValues.push(input.storeId);
      countFilters.push(`s.id = $${countValues.length}`);
    }

    if (input.query) {
      countValues.push(input.query);
      countFilters.push(`s.name ILIKE '%' || $${countValues.length} || '%' ESCAPE '\\'`);
    }

    if (input.environmentName) {
      countValues.push(input.environmentName);
      countFilters.push(`EXISTS (SELECT 1 FROM environments ex WHERE ex.store_id = s.id AND ex.name = $${countValues.length})`);
    }

    if (input.comfortStatus === "NO_DATA") {
      countFilters.push(`EXISTS (SELECT 1 FROM environments ex WHERE ex.store_id = s.id AND ex.last_seen_at IS NULL)`);
    } else if (input.comfortStatus) {
      countValues.push(input.comfortStatus);
      countFilters.push(`EXISTS (SELECT 1 FROM environments ex WHERE ex.store_id = s.id AND ex.last_seen_at IS NOT NULL AND ex.last_comfort_status = $${countValues.length})`);
    }

    const countWhere = countFilters.join(" AND ");
    const count = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM stores s WHERE ${countWhere}`,
      countValues,
    );
    const envNameFilter = envNameIndex
      ? `e.id IS NOT NULL AND e.name = $${envNameIndex}`
      : "e.id IS NOT NULL";
    const order = storeOrderSql(input.sort, input.dir === "desc" ? "DESC" : "ASC");
    values.push(input.limit, input.offset);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;
    const rows = await pool.query(
       `WITH period AS (
          SELECT e.store_id,
                 SUM(operating_seconds(e.operating_hours, s.timezone, $3::timestamptz, $4::timestamptz)) AS operating_seconds,
                 COALESCE(SUM(c.comfort_samples), 0) * 30 AS in_range_seconds,
                 COUNT(*) FILTER (WHERE COALESCE(c.above_total, 0) + COALESCE(c.below_total, 0) > 0)::int AS out_of_range_envs
          FROM environments e
          JOIN stores s ON s.id = e.store_id AND s.client_id = $1
          LEFT JOIN (
            SELECT environment_id,
                   SUM(comfort_samples) AS comfort_samples,
                   SUM(above_samples) AS above_total,
                   SUM(below_samples) AS below_total
            FROM cagg_environment_hourly
            WHERE bucket_hour >= $3::timestamptz AND bucket_hour < $4::timestamptz
            GROUP BY environment_id
          ) c ON c.environment_id = e.id
          GROUP BY e.store_id
        )
       SELECT s.id, s.name, s.city, s.uf,
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
          )::int AS offline_count,
          COALESCE(p.operating_seconds, 0) AS operating_seconds,
          COALESCE(p.in_range_seconds, 0) AS in_range_seconds,
          COALESCE(p.out_of_range_envs, 0)::int AS out_of_range_envs,
          COALESCE(
            json_agg(json_build_object(
              'id', e.id,
              'name', e.name,
              'comfortStatus', CASE
                WHEN e.last_seen_at IS NULL THEN 'NO_DATA'
                ELSE e.last_comfort_status
              END,
              'deviceStatus', CASE
                WHEN e.last_seen_at IS NULL THEN 'NO_DATA'
                WHEN $2::timestamptz - e.last_seen_at <= INTERVAL '15 minutes' THEN 'ONLINE'
                ELSE 'OFFLINE'
              END
            ) ORDER BY e.name)
              FILTER (WHERE ${envNameFilter}),
            '[]'::json
          ) AS environments
       FROM stores s
       LEFT JOIN environments e ON e.store_id = s.id
       LEFT JOIN period p ON p.store_id = s.id
       WHERE ${where}
       GROUP BY s.id, p.operating_seconds, p.in_range_seconds, p.out_of_range_envs
       ORDER BY ${order}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );
    return {
      total: Number(count.rows[0]?.total ?? 0),
      items: rows.rows.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        uf: row.uf,
        inRangeCount: row.in_range_count,
        aboveCount: row.above_count,
        belowCount: row.below_count,
        noDataCount: row.no_data_count,
        onlineCount: row.online_count,
        offlineCount: row.offline_count,
        operatingSeconds: Number(row.operating_seconds ?? 0),
        inRangeSeconds: Number(row.in_range_seconds ?? 0),
        outOfRangeEnvCount: row.out_of_range_envs ?? 0,
        environments: row.environments ?? [],
      })),
    };
  }

  async listNames(input: {
    clientId: string;
    allowedStoreIds: string[] | null;
    query?: string;
    selectedId?: string;
    limit: number;
  }): Promise<Array<{ id: string; name: string }>> {
    const filters = ["s.client_id = $1"];
    const values: unknown[] = [input.clientId];

    if (input.allowedStoreIds) {
      values.push(input.allowedStoreIds);
      filters.push(`s.id = ANY($${values.length}::text[])`);
    }

    if (input.query) {
      values.push(input.query);
      filters.push(`s.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\'`);
    }

    values.push(input.limit);
    const rows = await getPool().query<{ id: string; name: string }>(
      `SELECT s.id, s.name FROM stores s WHERE ${filters.join(" AND ")} ORDER BY s.name LIMIT $${values.length}`,
      values,
    );
    const items = rows.rows;

    if (input.selectedId && !items.some((item) => item.id === input.selectedId)) {
      const selectedFilters = ["s.client_id = $1", "s.id = $2"];
      const selectedValues: unknown[] = [input.clientId, input.selectedId];

      if (input.allowedStoreIds) {
        selectedValues.push(input.allowedStoreIds);
        selectedFilters.push(`s.id = ANY($${selectedValues.length}::text[])`);
      }

      const selected = await getPool().query<{ id: string; name: string }>(
        `SELECT s.id, s.name FROM stores s WHERE ${selectedFilters.join(" AND ")}`,
        selectedValues,
      );

      if (selected.rows[0]) {
        items.unshift(selected.rows[0]);
      }
    }

    return items;
  }
}

function storeOrderSql(sort: StoreListSort | undefined, dir: "ASC" | "DESC"): string {
  if (sort === "store") {
    return `s.name ${dir}`;
  }

  if (sort === "comfort") {
    return `CASE WHEN COALESCE(p.operating_seconds, 0) = 0 THEN -1
            ELSE LEAST(COALESCE(p.in_range_seconds, 0), p.operating_seconds) / p.operating_seconds END ${dir}, s.name ASC`;
  }

  if (sort === "device") {
    return `COUNT(*) FILTER (
              WHERE e.last_seen_at IS NOT NULL
                AND $2::timestamptz - e.last_seen_at <= INTERVAL '15 minutes'
            ) ${dir}, s.name ASC`;
  }

  if (sort === "outOfRange") {
    return `COALESCE(p.out_of_range_envs, 0) ${dir}, s.name ASC`;
  }

  return `CASE WHEN COALESCE(p.out_of_range_envs, 0) > 0 THEN 0 ELSE 1 END ASC, s.name ASC`;
}

export type { ComfortStatus };
