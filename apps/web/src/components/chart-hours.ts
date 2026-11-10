export interface OperatingTemperatures {
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  operatingAvgTemp: number | null;
  operatingMinTemp: number | null;
  operatingMaxTemp: number | null;
}

export function plottedTemperatures<T extends OperatingTemperatures>(point: T, onlyOperating: boolean): T {
  if (!onlyOperating) {
    return point;
  }
  return {
    ...point,
    avgTemp: point.operatingAvgTemp,
    minTemp: point.operatingMinTemp,
    maxTemp: point.operatingMaxTemp,
  };
}
