import { createHash } from "node:crypto";
import { DeviceRepository, type DeviceRow } from "../../repositories/device.repository";
import { commitBatch, type AcceptedSample, type BatchAnomaly, type BatchLatest } from "../../repositories/packet.repository";
import { comfortStatus } from "../comfort-status/comfort-status.service";
import { enrichPacket, type Packet } from "../enrich-packet/enrich-packet.service";
import { isOperatingAt } from "../operating-hours/operating-hours.service";
import { putRawPart } from "../../../../infra/object-store/object-store";
import { parsePacket } from "../parse-packet/parse-packet.service";
import { advanceVirtualNow, noteLive } from "../../../clock/services/virtual-clock/virtual-clock.service";

const PART_BYTES = 4 * 1024 * 1024;
const LANES = 4;
const devices = new DeviceRepository();

interface Prepared {
  line: string;
  packet: Packet;
  device: DeviceRow | null;
  recordedAt: Date;
  samples: AcceptedSample[];
  anomalies: Array<Omit<BatchAnomaly, "rawBatchKey">>;
  rawBatchKey: string;
}

export function laneOf(deviceId: string): number {
  const hash = createHash("sha1").update(deviceId).digest();
  return hash[0] % LANES;
}

export async function persistLine(line: string): Promise<boolean> {
  return ingestLines([line]);
}

export async function ingestLines(lines: string[]): Promise<boolean> {
  try {
    const prepared = await prepare(lines);
    if (prepared.length === 0) {
      return true;
    }
    await assignRawParts(prepared);
    const lanes: Prepared[][] = [[], [], [], []];
    for (const item of prepared) {
      lanes[laneOf(item.packet.deviceId)].push(item);
    }
    await commitBatch({ samples: [], anomalies: [], rawBatches: rawRows(prepared), latests: [], virtualNow: null });
    await Promise.all(lanes.filter((lane) => lane.length > 0).map((lane) => commitLane(lane)));
    await publishLane(prepared);
    return true;
  } catch (error) {
    console.error("sample commit rejected the batch", error);
    return false;
  }
}

async function prepare(lines: string[]): Promise<Prepared[]> {
  const prepared: Prepared[] = [];
  for (const line of lines) {
    const packet = parsePacket(line);
    if (!packet) {
      continue;
    }
    const device = await devices.findByDeviceId(packet.deviceId);
    const samples: AcceptedSample[] = [];
    const anomalies: Array<Omit<BatchAnomaly, "rawBatchKey">> = [];
    for (const point of enrichPacket(packet)) {
      if (!device) {
        anomalies.push({
          deviceId: packet.deviceId,
          sampleTime: point.sampleTime,
          temperature: point.temperature,
          reason: "UNKNOWN_DEVICE",
          environmentId: null,
        });
        continue;
      }
      if (point.kind === "anomaly") {
        anomalies.push({ ...point, environmentId: device.environmentId });
        continue;
      }
      samples.push({
        point,
        environmentId: device.environmentId,
        storeId: device.storeId,
        comfortStatus: comfortStatus(point.temperature, device.comfortMin, device.comfortMax),
        isOperatingHours: isOperatingAt(point.sampleTime, device.timezone, device.operatingHours),
      });
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

async function assignRawParts(prepared: Prepared[]): Promise<void> {
  const groups: Prepared[][] = [];
  const sizes: number[] = [];
  for (const item of prepared) {
    const clientId = item.device?.clientId ?? "unknown";
    const hour = item.recordedAt.toISOString().slice(0, 13);
    const size = Buffer.byteLength(item.line) + 1;
    const index = groups.findIndex((group, groupIndex) => {
      const first = group[0];
      const sameClient = (first.device?.clientId ?? "unknown") === clientId;
      return sameClient
        && first.recordedAt.toISOString().slice(0, 13) === hour
        && sizes[groupIndex] + size <= PART_BYTES;
    });
    if (index < 0) {
      groups.push([item]);
      sizes.push(size);
      continue;
    }
    groups[index].push(item);
    sizes[index] += size;
  }
  await Promise.all(groups.map(async (group) => {
    const clientId = group[0].device?.clientId ?? "unknown";
    const key = await putRawPart(group.map((item) => item.line), group[0].recordedAt, clientId);
    for (const item of group) {
      item.rawBatchKey = key;
    }
  }));
}

async function commitLane(lane: Prepared[]): Promise<void> {
  const samples = lane.flatMap((item) => item.samples.map((sample) => ({ ...sample, rawBatchKey: item.rawBatchKey })));
  const anomalies = lane.flatMap((item) => item.anomalies.map((anomaly) => ({ ...anomaly, rawBatchKey: item.rawBatchKey })));
  await commitBatch({
    samples,
    anomalies,
    rawBatches: [],
    latests: winners(lane),
    virtualNow: newestSample(samples),
  });
}

function rawRows(lane: Prepared[]): Array<{ key: string; clientId: string; recordedAt: Date; packetCount: number }> {
  const counts = new Map<string, { clientId: string; recordedAt: Date; packetCount: number }>();
  for (const item of lane) {
    if (!item.device || !item.rawBatchKey) {
      continue;
    }
    const current = counts.get(item.rawBatchKey);
    if (current) {
      current.packetCount += 1;
      continue;
    }
    counts.set(item.rawBatchKey, { clientId: item.device.clientId, recordedAt: item.recordedAt, packetCount: 1 });
  }
  return [...counts.entries()].map(([key, row]) => ({ key, ...row }));
}

function newestSample(samples: Array<{ point: { sampleTime: Date } }>): Date | null {
  return samples.reduce<Date | null>((max, sample) => {
    const time = sample.point.sampleTime;
    return !max || time > max ? time : max;
  }, null);
}

function winners(lane: Prepared[]): BatchLatest[] {
  const latest = new Map<string, BatchLatest>();
  for (const item of lane) {
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

async function publishLane(prepared: Prepared[]): Promise<void> {
  const latests = winners(prepared);
  if (latests.length === 0) {
    return;
  }
  const newest = latests.reduce((max, item) => item.sample.point.sampleTime > max ? item.sample.point.sampleTime : max, latests[0].sample.point.sampleTime);
  const virtualNow = new Date(await advanceVirtualNow(newest));
  for (const item of prepared) {
    const sample = item.samples.at(-1);
    if (!item.device || !sample) {
      continue;
    }
    const chosen = latests.find((latest) => latest.sample.environmentId === sample.environmentId);
    if (!chosen || chosen.sample !== sample) {
      continue;
    }
    noteLive(item.device.clientId, sample.environmentId, {
      type: "environment.updated",
      environmentId: sample.environmentId,
      storeId: sample.storeId,
      lastTemp: sample.point.temperature,
      latestAt: sample.point.sampleTime.toISOString(),
      lastComfortStatus: sample.comfortStatus,
      deviceStatus: virtualNow.getTime() - sample.point.sampleTime.getTime() <= 15 * 60 * 1000 ? "ONLINE" : "OFFLINE",
      isCurrentlyOperating: isOperatingAt(virtualNow, item.device.timezone, item.device.operatingHours),
      virtualNow: virtualNow.toISOString(),
    });
  }
}
