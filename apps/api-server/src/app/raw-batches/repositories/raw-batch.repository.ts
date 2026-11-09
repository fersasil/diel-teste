import { getPool } from "../../../infra/database/pg-pool";

export interface RawBatchRow {
  batchKey: string;
  recordedAt: string;
  packetCount: number;
}

export class RawBatchRepository {
  async listByDay(clientId: string, date: string): Promise<RawBatchRow[]> {
    const result = await getPool().query(
      `SELECT batch_key, recorded_at, packet_count
       FROM raw_batches
       WHERE client_id = $1
         AND recorded_at >= $2::date
         AND recorded_at < ($2::date + INTERVAL '1 day')
       ORDER BY recorded_at ASC`,
      [clientId, date],
    );
    return result.rows.map((row) => ({
      batchKey: row.batch_key,
      recordedAt: new Date(row.recorded_at).toISOString(),
      packetCount: row.packet_count,
    }));
  }
}
