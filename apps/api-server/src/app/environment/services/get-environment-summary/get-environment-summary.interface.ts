import type { DeviceStatus } from "../device-status/device-status.interface";
import type { EnvironmentRow } from "../../repositories/environment.repository";

export interface EnvironmentSummary {
  name: string;
  storeName: string;
  timezone: string;
  comfortMin: number;
  comfortMax: number;
  lastTemp: number | null;
  lastComfortStatus: EnvironmentRow["lastComfortStatus"];
  deviceStatus: DeviceStatus;
  isCurrentlyOperating: boolean;
  comfortPercent: number | null;
}
