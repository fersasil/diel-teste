import { getPool } from "../../../infra/database/pg-pool";
import type { SamplePoint } from "../services/enrich-packet/enrich-packet.service";

export class SampleRepository {
  async upsert(sample: SamplePoint & {
    environmentId: string;
    storeId: string;
    comfortStatus: "IN_RANGE" | "ABOVE" | "BELOW";
    isOperatingHours: boolean;
    rawBatchKey: string;
  }): Promise<void> {
    await getPool().query(
      `INSERT INTO telemetry_samples (
         sample_time, environment_id, store_id, dev_id, temperature,
         is_operating_hours, comfort_status, is_delayed_packet, raw_batch_key
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (environment_id, sample_time) DO UPDATE SET
         temperature = EXCLUDED.temperature,
         is_operating_hours = EXCLUDED.is_operating_hours,
         comfort_status = EXCLUDED.comfort_status,
         is_delayed_packet = EXCLUDED.is_delayed_packet,
         raw_batch_key = EXCLUDED.raw_batch_key`,
      [
        sample.sampleTime,
        sample.environmentId,
        sample.storeId,
        sample.deviceId,
        sample.temperature,
        sample.isOperatingHours,
        sample.comfortStatus,
        sample.isDelayedPacket,
        sample.rawBatchKey,
      ],
    );
  }
}
