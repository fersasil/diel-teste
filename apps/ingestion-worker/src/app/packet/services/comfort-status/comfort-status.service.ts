import type { ComfortStatus } from "./comfort-status.interface";

export type { ComfortStatus } from "./comfort-status.interface";

export function comfortStatus(temperature: number, minimum: number, maximum: number): ComfortStatus {
  if (temperature < minimum) {
    return "BELOW";
  }

  if (temperature > maximum) {
    return "ABOVE";
  }

  return "IN_RANGE";
}
