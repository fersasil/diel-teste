import { Injectable } from "@nestjs/common";
import type { PoolClient } from "pg";
import { PgPool } from "../../../infra/database/pg-pool";
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

export interface RawBatchRow {
  key: string;
  clientId: string;
  recordedAt: Date;
  packetCount: number;
}

export interface CommitBatch {
  samples: Array<AcceptedSample & { rawBatchKey: string }>;
  anomalies: BatchAnomaly[];
  rawBatches: RawBatchRow[];
  latests: BatchLatest[];
  virtualNow: Date | null;
}

@Injectable()
export class PacketRepository {
  public constructor(private readonly database: PgPool) {}

  // Samples, anomalies, the raw-object index, the environment snapshot, and the clock share one transaction.
  public async commit(input: CommitBatch): Promise<void> {
    const client = await this.database.get().connect();
    try {
      await client.query("BEGIN");
      await this.insertSamples(client, input.samples);
      await this.insertAnomalies(client, input.anomalies);
      await this.insertRawBatches(client, input.rawBatches);
      await this.updateEnvironments(client, input.latests);
      await this.advanceClock(client, input.virtualNow);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertSamples(
    client: PoolClient,
    samples: CommitBatch["samples"],
  ): Promise<void> {
    if (samples.length === 0) {
      return;
    }

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
        samples.map((sample) => sample.point.sampleTime),
        samples.map((sample) => sample.environmentId),
        samples.map((sample) => sample.storeId),
        samples.map((sample) => sample.point.deviceId),
        samples.map((sample) => sample.point.temperature),
        samples.map((sample) => sample.isOperatingHours),
        samples.map((sample) => sample.comfortStatus),
        samples.map((sample) => sample.point.isDelayedPacket),
        samples.map((sample) => sample.rawBatchKey),
      ],
    );
  }

  private async insertAnomalies(client: PoolClient, anomalies: BatchAnomaly[]): Promise<void> {
    if (anomalies.length === 0) {
      return;
    }

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
        anomalies.map((anomaly) => anomaly.sampleTime),
        anomalies.map((anomaly) => anomaly.deviceId),
        anomalies.map((anomaly) => anomaly.environmentId),
        anomalies.map((anomaly) => anomaly.temperature),
        anomalies.map((anomaly) => anomaly.reason),
        anomalies.map((anomaly) => anomaly.rawBatchKey),
      ],
    );
  }

  private async insertRawBatches(client: PoolClient, rawBatches: RawBatchRow[]): Promise<void> {
    if (rawBatches.length === 0) {
      return;
    }

    await client.query(
      `INSERT INTO raw_batches (batch_key, client_id, recorded_at, packet_count)
       SELECT * FROM UNNEST($1::varchar[], $2::varchar[], $3::timestamptz[], $4::int[])
       ON CONFLICT (batch_key) DO NOTHING`,
      [
        rawBatches.map((batch) => batch.key),
        rawBatches.map((batch) => batch.clientId),
        rawBatches.map((batch) => batch.recordedAt),
        rawBatches.map((batch) => batch.packetCount),
      ],
    );
  }

  private async updateEnvironments(client: PoolClient, latests: BatchLatest[]): Promise<void> {
    if (latests.length === 0) {
      return;
    }

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
        latests.map((latest) => latest.sample.environmentId),
        latests.map((latest) => latest.sample.point.sampleTime),
        latests.map((latest) => latest.sample.point.temperature),
        latests.map((latest) => latest.sample.comfortStatus),
        latests.map((latest) => latest.operatingNow),
      ],
    );
  }

  private async advanceClock(client: PoolClient, virtualNow: Date | null): Promise<void> {
    if (!virtualNow) {
      return;
    }

    await client.query(
      `INSERT INTO virtual_clock (id, virtual_now)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE
         SET virtual_now = EXCLUDED.virtual_now
       WHERE virtual_clock.virtual_now < EXCLUDED.virtual_now`,
      [virtualNow],
    );
  }
}
