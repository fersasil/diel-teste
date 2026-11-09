import type { ExternalPoint, IndoorBounds } from "./attach-external-weather.interface";

export type { ExternalPoint, IndoorBounds } from "./attach-external-weather.interface";

export function attachExternalWeather<T extends IndoorBounds>(
  detail: T,
  external: ExternalPoint[],
): T & { external: ExternalPoint[] } {
  return {
    ...detail,
    comfortMin: detail.comfortMin,
    comfortMax: detail.comfortMax,
    external,
  };
}
