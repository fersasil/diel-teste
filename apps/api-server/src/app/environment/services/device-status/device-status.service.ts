import type { DeviceStatus } from "./device-status.interface";

export type { DeviceStatus } from "./device-status.interface";

const ONLINE_MS = 15 * 60 * 1000;

export function deviceStatus(lastSeenAt: Date | null, virtualNow: Date): DeviceStatus {
  if (lastSeenAt === null) {
    return "NO_DATA";
  }
  const elapsed = virtualNow.getTime() - lastSeenAt.getTime();
  if (elapsed <= ONLINE_MS) {
    return "ONLINE";
  }
  return "OFFLINE";
}
