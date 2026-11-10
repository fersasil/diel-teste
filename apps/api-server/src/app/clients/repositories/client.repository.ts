import { getPool } from "../../../infra/database/pg-pool";

export type ClientListSort = "name" | "segment";

export interface ClientListRow {
  id: string;
  name: string;
  segment: string;
}

export class ClientRepository {
  async findById(id: string): Promise<{ id: string; name: string } | null> {
    const result = await getPool().query(
      `SELECT id, name FROM clients WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return { id: row.id, name: row.name };
  }

  async list(input: {
    query?: string;
    sort?: ClientListSort;
    dir?: "asc" | "desc";
    limit: number;
    offset: number;
  }): Promise<{ items: ClientListRow[]; total: number }> {
    const filters: string[] = [];
    const values: unknown[] = [];

    if (input.query) {
      values.push(input.query);
      filters.push(`c.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\'`);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const count = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM clients c ${where}`,
      values,
    );
    const dir = input.dir === "desc" ? "DESC" : "ASC";
    const order = input.sort === "segment"
      ? `c.segment ${dir}, c.name ASC`
      : `c.name ${dir}`;
    values.push(input.limit, input.offset);
    const rows = await getPool().query<ClientListRow>(
      `SELECT c.id, c.name, c.segment
       FROM clients c
       ${where}
       ORDER BY ${order}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return {
      total: Number(count.rows[0]?.total ?? 0),
      items: rows.rows,
    };
  }
}
