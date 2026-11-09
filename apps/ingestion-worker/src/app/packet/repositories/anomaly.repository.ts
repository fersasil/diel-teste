import { getPool } from "../../../infra/database/pg-pool";

export class AnomalyRepository {
  async insert(input: {
    detectedAt: Date;
    deviceId: string;
    environmentId: string | null;
    rawValue: number;
    reason: "OUT_OF_RANGE" | "UNKNOWN_DEVICE";
    rawBatchKey: string | null;
  }): Promise<void> {
    await getPool().query(
      `INSERT INTO telemetry_anomalies (
         detected_at, dev_id, environment_id, raw_value, reason, raw_batch_key
       ) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (dev_id, detected_at, reason, raw_value) DO NOTHING`,
      [
        input.detectedAt,
        input.deviceId,
        input.environmentId,
        input.rawValue,
        input.reason,
        input.rawBatchKey,
      ],
    );
  }
}
