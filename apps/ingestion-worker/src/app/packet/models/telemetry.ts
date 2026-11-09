export const COMFORT_STATUSES = ["IN_RANGE", "ABOVE", "BELOW"] as const;
export type ComfortStatus = (typeof COMFORT_STATUSES)[number];

export interface TelemetrySample {
  sampleTime: Date;
  environmentId: string;
  storeId: string;
  deviceId: string;
  temperature: number;
  isOperatingHours: boolean;
  comfortStatus: ComfortStatus;
  isDelayedPacket: boolean;
  rawBatchKey: string | null;
}

const MIN_TEMPERATURE = -10;
const MAX_TEMPERATURE = 60;

export function assertTemperature(temperature: number): void {
  if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
    throw new Error("temperature must be between -10 and 60 inclusive");
  }
}
