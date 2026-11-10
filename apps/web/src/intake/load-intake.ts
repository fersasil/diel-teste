import { serverApiBase } from "../shared/api-base";
import { kindFromStatus, type LoadKind } from "../shared/load-state";

export interface UnknownDevice {
  deviceId: string;
  readings: number;
  lastAt: string;
  lastValue: number | null;
}

export interface DeviceTraffic {
  deviceId: string;
  environmentName: string | null;
  storeName: string | null;
  totalBytes: number;
  bytesPerHour: number;
}

export interface IntakeView {
  packets: number;
  acceptedReadings: number;
  unknownReadings: number;
  outOfRangeReadings: number;
  unknownDevices: UnknownDevice[];
  devices: DeviceTraffic[];
}

export async function loadIntake(token: string): Promise<IntakeView | LoadKind> {
  try {
    const response = await fetch(`${serverApiBase()}/api/v1/intake`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as IntakeView & { code?: string };
    const kind = kindFromStatus(response.status, body.code);
    if (kind !== "ok") {
      return kind;
    }
    return {
      packets: body.packets ?? 0,
      acceptedReadings: body.acceptedReadings ?? 0,
      unknownReadings: body.unknownReadings ?? 0,
      outOfRangeReadings: body.outOfRangeReadings ?? 0,
      unknownDevices: body.unknownDevices ?? [],
      devices: body.devices ?? [],
    };
  } catch {
    return "failure";
  }
}
