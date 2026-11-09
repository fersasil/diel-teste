import type { ComfortStatus } from "../../../../shared/models/cadastro";
import type { DeviceStatus } from "../device-status/device-status.interface";

export interface EnvironmentListItem {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  comfortStatus: ComfortStatus | "NO_DATA";
  deviceStatus: DeviceStatus;
  comfortPercent: number | null;
  outOfRangeEnvCount: number;
  lastSeenAt: string | null;
}

export interface EnvironmentPage {
  page: number;
  pageSize: number;
  total: number;
  items: EnvironmentListItem[];
  code?: "CLIENT_FOCUS_REQUIRED";
}

export type ComfortFilter = "IN_RANGE" | "ABOVE" | "BELOW" | "NO_DATA";
export type DeviceFilter = "ONLINE" | "OFFLINE" | "NO_DATA";
export type EnvironmentSort = "store" | "environment" | "comfort" | "device";
