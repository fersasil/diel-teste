import { Injectable } from "@nestjs/common";
import { PgPool } from "../../../infra/database/pg-pool";

@Injectable()
export class AnomalyRepository {
  public constructor(private readonly database: PgPool) {}

  public async insert(input: {
    detectedAt: Date;
    deviceId: string;
    environmentId: string | null;
    rawValue: number;
    reason: "OUT_OF_RANGE" | "UNKNOWN_DEVICE";
    rawBatchKey: string | null;
  }): Promise<void> {
    await this.database.get().query(
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
