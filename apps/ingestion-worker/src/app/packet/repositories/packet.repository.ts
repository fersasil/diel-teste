import { getPool } from "../../../infra/database/pg-pool";
import type { SamplePoint } from "../services/enrich-packet/enrich-packet.service";

export interface AcceptedSample {
  point: SamplePoint;
  environmentId: string;
  storeId: string;
  comfortStatus: "IN_RANGE" | "ABOVE" | "BELOW";
  isOperatingHours: boolean;
}

export interface BatchAnomaly {
  sampleTime: Date;
  deviceId: string;
  temperature: number;
  reason: "OUT_OF_RANGE" | "UNKNOWN_DEVICE";
  environmentId: string | null;
  rawBatchKey: string;
}

export interface BatchLatest {
  sample: AcceptedSample;
  operatingNow: boolean;
}

export async function commitBatch(input: {
  samples: Array<AcceptedSample & { rawBatchKey: string }>;
  anomalies: BatchAnomaly[];
  rawBatches: Array<{ key: string; clientId: string; recordedAt: Date; packetCount: number }>;
  latests: BatchLatest[];
}): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (input.samples.length > 0) {
      await client.query(
        `INSERT INTO telemetry_samples (
           sample_time, environment_id, store_id, dev_id, temperature,
           is_operating_hours, comfort_status, is_delayed_packet, raw_batch_key
         )
         SELECT * FROM UNNEST(
           $1::timestamptz[], $2::varchar[], $3::varchar[], $4::varchar[],
           $5::float8[], $6::boolean[], $7::varchar[], $8::boolean[], $9::varchar[]
         )
         ON CONFLICT (environment_id, sample_time) DO UPDATE SET
           temperature = EXCLUDED.temperature,
           is_operating_hours = EXCLUDED.is_operating_hours,
           comfort_status = EXCLUDED.comfort_status,
           is_delayed_packet = EXCLUDED.is_delayed_packet,
           raw_batch_key = EXCLUDED.raw_batch_key
         WHERE telemetry_samples.temperature IS DISTINCT FROM EXCLUDED.temperature
            OR telemetry_samples.is_operating_hours IS DISTINCT FROM EXCLUDED.is_operating_hours
            OR telemetry_samples.comfort_status IS DISTINCT FROM EXCLUDED.comfort_status
            OR telemetry_samples.is_delayed_packet IS DISTINCT FROM EXCLUDED.is_delayed_packet
            OR telemetry_samples.raw_batch_key IS DISTINCT FROM EXCLUDED.raw_batch_key`,
        [
          input.samples.map((sample) => sample.point.sampleTime),
          input.samples.map((sample) => sample.environmentId),
          input.samples.map((sample) => sample.storeId),
          input.samples.map((sample) => sample.point.deviceId),
          input.samples.map((sample) => sample.point.temperature),
          input.samples.map((sample) => sample.isOperatingHours),
          input.samples.map((sample) => sample.comfortStatus),
          input.samples.map((sample) => sample.point.isDelayedPacket),
          input.samples.map((sample) => sample.rawBatchKey),
        ],
      );
    }
    if (input.anomalies.length > 0) {
      await client.query(
        `INSERT INTO telemetry_anomalies (
           detected_at, dev_id, environment_id, raw_value, reason, raw_batch_key
         )
         SELECT * FROM UNNEST(
           $1::timestamptz[], $2::varchar[], $3::varchar[],
           $4::float8[], $5::varchar[], $6::varchar[]
         )
         ON CONFLICT (dev_id, detected_at, reason, raw_value) DO NOTHING`,
        [
          input.anomalies.map((anomaly) => anomaly.sampleTime),
          input.anomalies.map((anomaly) => anomaly.deviceId),
          input.anomalies.map((anomaly) => anomaly.environmentId),
          input.anomalies.map((anomaly) => anomaly.temperature),
          input.anomalies.map((anomaly) => anomaly.reason),
          input.anomalies.map((anomaly) => anomaly.rawBatchKey),
        ],
      );
    }
    if (input.rawBatches.length > 0) {
      await client.query(
        `INSERT INTO raw_batches (batch_key, client_id, recorded_at, packet_count)
         SELECT * FROM UNNEST($1::varchar[], $2::varchar[], $3::timestamptz[], $4::int[])
         ON CONFLICT (batch_key) DO NOTHING`,
        [
          input.rawBatches.map((batch) => batch.key),
          input.rawBatches.map((batch) => batch.clientId),
          input.rawBatches.map((batch) => batch.recordedAt),
          input.rawBatches.map((batch) => batch.packetCount),
        ],
      );
    }
    if (input.latests.length > 0) {
      await client.query(
        `UPDATE environments AS env
         SET last_seen_at = incoming.seen_at,
             last_temp = incoming.temp,
             last_comfort_status = incoming.comfort,
             is_currently_operating = incoming.operating
         FROM UNNEST($1::varchar[], $2::timestamptz[], $3::float8[], $4::varchar[], $5::boolean[])
           AS incoming(id, seen_at, temp, comfort, operating)
         WHERE env.id = incoming.id
           AND (env.last_seen_at IS NULL OR env.last_seen_at <= incoming.seen_at)`,
        [
          input.latests.map((latest) => latest.sample.environmentId),
          input.latests.map((latest) => latest.sample.point.sampleTime),
          input.latests.map((latest) => latest.sample.point.temperature),
          input.latests.map((latest) => latest.sample.comfortStatus),
          input.latests.map((latest) => latest.operatingNow),
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
