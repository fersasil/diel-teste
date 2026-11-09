import type { Packet } from "../enrich-packet/enrich-packet.service";

interface RawLine {
  dev_id?: string;
  deviceId?: string;
  timestamp?: string;
  GMT?: number;
  samplingTime?: number;
  intervalSeconds?: number;
  Temperature?: number[];
  readings?: number[];
  savedData?: boolean;
  saved_data?: boolean;
}

export function parsePacket(line: string): Packet | null {
  let raw: RawLine;
  try {
    raw = JSON.parse(line) as RawLine;
  } catch {
    return null;
  }
  const deviceId = raw.deviceId ?? raw.dev_id;
  const readings = raw.readings ?? raw.Temperature;
  const timestamp = raw.timestamp;
  const intervalSeconds = raw.intervalSeconds ?? raw.samplingTime;
  if (!deviceId || !timestamp || !readings?.length || !intervalSeconds || intervalSeconds <= 0) {
    return null;
  }
  const utc = raw.deviceId
    ? new Date(timestamp)
    : new Date(Date.parse(`${timestamp}Z`) - Number(raw.GMT ?? 0) * 3_600_000);
  if (Number.isNaN(utc.getTime())) {
    return null;
  }
  return {
    deviceId,
    timestamp: utc.toISOString(),
    intervalSeconds,
    readings,
    savedData: Boolean(raw.savedData ?? raw.saved_data),
  };
}
