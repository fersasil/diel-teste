import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

@Injectable()
export class PgPool {
  private pool: Pool | undefined;

  get(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is required");
      }
      const peak = Number(process.env.INGEST_CONCURRENCY_PEAK ?? 32);
      const max = Number.isInteger(peak) && peak > 0 ? peak + 8 : 40;
      this.pool = new Pool({ connectionString, max });
    }
    return this.pool;
  }

  async close(): Promise<void> {
    if (!this.pool) {
      return;
    }
    const current = this.pool;
    this.pool = undefined;
    await current.end();
  }
}

let database: PgPool | undefined;

export function getPool(): Pool {
  database ??= new PgPool();
  return database.get();
}

export async function closePool(): Promise<void> {
  await database?.close();
}

export function useDatabase(pool: PgPool): void {
  database = pool;
}
