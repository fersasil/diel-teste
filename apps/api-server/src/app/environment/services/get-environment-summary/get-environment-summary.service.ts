import { comfortPercent } from "../../../../shared/comfort/comfort-percent";
import { deviceStatus } from "../device-status/device-status.service";
import type { EnvironmentRow } from "../../repositories/environment.repository";
import type { EnvironmentSummary } from "./get-environment-summary.interface";

export type { EnvironmentSummary } from "./get-environment-summary.interface";

export function summarizeScoped(
  environment: EnvironmentRow | null,
  virtualNow: Date,
  operatingSeconds: number,
  inRangeSeconds: number,
): EnvironmentSummary | { code: "NOT_FOUND" } {
  if (!environment) {
    return { code: "NOT_FOUND" };
  }
  return summarize(environment, virtualNow, operatingSeconds, inRangeSeconds);
}

export function summarize(
  environment: EnvironmentRow,
  virtualNow: Date,
  operatingSeconds: number,
  inRangeSeconds: number,
): EnvironmentSummary {
  return {
    name: environment.name,
    storeName: environment.storeName,
    timezone: environment.timezone,
    comfortMin: environment.comfortMin,
    comfortMax: environment.comfortMax,
    lastTemp: environment.lastTemp,
    lastComfortStatus: environment.lastComfortStatus,
    deviceStatus: deviceStatus(environment.lastSeenAt, virtualNow),
    isCurrentlyOperating: environment.isCurrentlyOperating,
    comfortPercent: comfortPercent(inRangeSeconds, operatingSeconds),
  };
}
