import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ObjectStore } from "../../../../infra/object-store/object-store";
import { PublishLiveService } from "../../../clock/services/publish-live/publish-live.service";
import { VirtualClockService } from "../../../clock/services/virtual-clock/virtual-clock.service";
import { DeviceRepository, type DeviceRow } from "../../repositories/device.repository";
import {
  PacketRepository,
  type AcceptedSample,
  type BatchAnomaly,
  type BatchLatest,
  type RawBatchRow,
} from "../../repositories/packet.repository";
import { comfortStatus } from "../comfort-status/comfort-status.service";
import { enrichPacket, type EnrichedPoint, type Packet } from "../enrich-packet/enrich-packet.service";
import { isOperatingAt } from "../operating-hours/operating-hours.service";
import { parsePacket } from "../parse-packet/parse-packet.service";

const PART_BYTES = 4 * 1024 * 1024;
const LANE_COUNT = 4;
const ONLINE_MS = 15 * 60 * 1000;
type PendingAnomaly = Omit<BatchAnomaly, "rawBatchKey">;

interface Prepared {
  line: string;
  packet: Packet;
  device: DeviceRow | null;
  recordedAt: Date;
  samples: AcceptedSample[];
  anomalies: PendingAnomaly[];
  rawBatchKey: string;
}

interface RawGroup {
  items: Prepared[];
  bytes: number;
}

// A device always lands on the same lane, so two lanes never write its series at once.
export function laneOf(deviceId: string): number {
  return createHash("sha1").update(deviceId).digest()[0] % LANE_COUNT;
}

@Injectable()
export class IngestBatchService {
  public constructor(
    private readonly devices: DeviceRepository,
    private readonly packets: PacketRepository,
    private readonly objects: ObjectStore,
    private readonly clock: VirtualClockService,
    private readonly live: PublishLiveService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IngestBatchService.name);
  }

  // Durability order: MinIO raw text, object index, samples and anomalies, then live events.
  // True acknowledges the stream. False keeps the batch pending. Unparsed lines are skipped.
  public async execute(lines: string[]): Promise<boolean> {
    try {
      // Enriquecimento e classificação
      const prepared = await this.buildSamplesAndAnomalies(lines);

      if (prepared.length === 0) {
        return true;
      }

      await this.storeRawLinesByClientHour(prepared);

      await this.packets.commit({
        samples: [],
        anomalies: [],
        rawBatches: this.indexKnownDeviceRawObjects(prepared),
        latests: [],
        virtualNow: null,
      });

      // salva no banco de dados
      await Promise.all(this.groupByDeviceLane(prepared).map((lane) => this.commitLaneSamples(lane)));

      await this.publishEnvironmentUpdates(prepared);
      return true;
    } catch (error) {
      this.logger.error({ err: error }, "sample commit rejected the batch");

      return false;
    }
  }

  private async buildSamplesAndAnomalies(lines: string[]): Promise<Prepared[]> {
    const prepared: Prepared[] = [];
    for (const line of lines) {
      const packet = parsePacket(line);

      if (!packet) {
        continue;
      }

      const device = await this.devices.findByDeviceId(packet.deviceId);
      const samples: AcceptedSample[] = [];
      const anomalies: PendingAnomaly[] = [];
      for (const point of enrichPacket(packet)) {
        const classified = this.toSampleOrAnomaly(point, device);

        if (classified.sample) {
          samples.push(classified.sample);
        }

        if (classified.anomaly) {
          anomalies.push(classified.anomaly);
        }
      }

      prepared.push({
        line,
        packet,
        device,
        recordedAt: new Date(packet.timestamp),
        samples,
        anomalies,
        rawBatchKey: "",
      });
    }

    return prepared;
  }

  // Unknown devices and out-of-range temperatures are stored as anomalies, not samples.
  private toSampleOrAnomaly(point: EnrichedPoint, device: DeviceRow | null): {
    sample?: AcceptedSample;
    anomaly?: PendingAnomaly;
  } {
    if (!device) {
      return {
        anomaly: {
          deviceId: point.deviceId,
          sampleTime: point.sampleTime,
          temperature: point.temperature,
          reason: "UNKNOWN_DEVICE",
          environmentId: null,
        },
      };
    }

    if (point.kind === "anomaly") {
      return {
        anomaly: {
          deviceId: point.deviceId,
          sampleTime: point.sampleTime,
          temperature: point.temperature,
          reason: point.reason,
          environmentId: device.environmentId,
        },
      };
    }

    return {
      sample: {
        point,
        environmentId: device.environmentId,
        storeId: device.storeId,
        comfortStatus: comfortStatus(point.temperature, device.comfortMin, device.comfortMax),
        isOperatingHours: isOperatingAt(point.sampleTime, device.timezone, device.operatingHours),
      },
    };
  }

  // Group the original text by client and hour, up to 4 MB, and store each group in MinIO.
  private async storeRawLinesByClientHour(prepared: Prepared[]): Promise<void> {
    const groups: RawGroup[] = [];
    for (const item of prepared) {
      const bytes = Buffer.byteLength(item.line) + 1;
      const group = groups.find((candidate) => this.sameClientHourWithinCap(candidate, item, bytes));

      if (!group) {
        groups.push({ items: [item], bytes });
        continue;
      }

      group.items.push(item);
      group.bytes += bytes;
    }

    await Promise.all(groups.map(async (group) => {
      const first = group.items[0];
      const key = await this.objects.putRawPart(
        group.items.map((item) => item.line),
        first.recordedAt,
        clientIdOrUnknown(first),
      );
      for (const item of group.items) {
        item.rawBatchKey = key;
      }
    }));
  }

  private sameClientHourWithinCap(group: RawGroup, item: Prepared, bytes: number): boolean {
    const first = group.items[0];
    return clientIdOrUnknown(first) === clientIdOrUnknown(item)
      && recordedHourKey(first) === recordedHourKey(item)
      && group.bytes + bytes <= PART_BYTES;
  }

  private groupByDeviceLane(prepared: Prepared[]): Prepared[][] {
    const lanes: Prepared[][] = Array.from({ length: LANE_COUNT }, () => []);
    for (const item of prepared) {
      lanes[laneOf(item.packet.deviceId)].push(item);
    }

    return lanes.filter((lane) => lane.length > 0);
  }

  private async commitLaneSamples(lane: Prepared[]): Promise<void> {
    const samples = lane.flatMap((item) => item.samples.map((sample) => ({
      ...sample,
      rawBatchKey: item.rawBatchKey,
    })));
    const anomalies = lane.flatMap((item) => item.anomalies.map((anomaly) => ({
      ...anomaly,
      rawBatchKey: item.rawBatchKey,
    })));

    await this.packets.commit({
      samples,
      anomalies,
      rawBatches: [],
      latests: this.newestSamplePerEnvironment(lane),
      virtualNow: this.latestSampleTime(samples),
    });
  }

  // Written before the samples so the key exists. Unknown devices stay out of the index.
  private indexKnownDeviceRawObjects(prepared: Prepared[]): RawBatchRow[] {
    const counts = new Map<string, RawBatchRow>();
    for (const item of prepared) {

      if (!item.device || !item.rawBatchKey) {
        continue;
      }

      const current = counts.get(item.rawBatchKey);

      if (current) {
        current.packetCount += 1;
        continue;
      }

      counts.set(item.rawBatchKey, {
        key: item.rawBatchKey,
        clientId: item.device.clientId,
        recordedAt: item.recordedAt,
        packetCount: 1,
      });
    }

    return [...counts.values()];
  }

  private latestSampleTime(samples: Array<{ point: { sampleTime: Date } }>): Date | null {
    return samples.reduce<Date | null>((max, sample) => {
      const time = sample.point.sampleTime;
      return !max || time > max ? time : max;
    }, null);

  }

  // Readings run oldest to newest, so the last sample of a packet is the one the screen shows.
  private newestSamplePerEnvironment(prepared: Prepared[]): BatchLatest[] {
    const latest = new Map<string, BatchLatest>();
    for (const item of prepared) {
      const sample = item.samples.at(-1);

      if (!item.device || !sample) {
        continue;
      }

      const current = latest.get(sample.environmentId);

      if (current && current.sample.point.sampleTime >= sample.point.sampleTime) {
        continue;
      }

      latest.set(sample.environmentId, {
        sample,
        operatingNow: isOperatingAt(sample.point.sampleTime, item.device.timezone, item.device.operatingHours),
      });
    }

    return [...latest.values()];
  }

  // Live events leave only after the database accepts the batch.
  private async publishEnvironmentUpdates(prepared: Prepared[]): Promise<void> {
    const latest = this.newestSamplePerEnvironment(prepared);

    if (latest.length === 0) {
      return;
    }

    const newest = latest.reduce(
      (max, item) => (item.sample.point.sampleTime > max ? item.sample.point.sampleTime : max),
      latest[0].sample.point.sampleTime,
    );
    const virtualNow = new Date(await this.clock.execute(newest));
    const shown = new Set(latest.map((item) => item.sample));
    for (const item of prepared) {
      const sample = item.samples.at(-1);

      if (!item.device || !sample || !shown.has(sample)) {
        continue;
      }

      const ageMs = virtualNow.getTime() - sample.point.sampleTime.getTime();
      this.live.execute(item.device.clientId, sample.environmentId, {
        type: "environment.updated",
        environmentId: sample.environmentId,
        storeId: sample.storeId,
        lastTemp: sample.point.temperature,
        latestAt: sample.point.sampleTime.toISOString(),
        lastComfortStatus: sample.comfortStatus,
        deviceStatus: ageMs <= ONLINE_MS ? "ONLINE" : "OFFLINE",
        isCurrentlyOperating: isOperatingAt(virtualNow, item.device.timezone, item.device.operatingHours),
        virtualNow: virtualNow.toISOString(),
      });
    }
  }
}

function clientIdOrUnknown(item: Prepared): string {
  return item.device?.clientId ?? "unknown";
}

function recordedHourKey(item: Prepared): string {
  return item.recordedAt.toISOString().slice(0, 13);
}
