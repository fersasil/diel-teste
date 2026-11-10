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
  code?: "FORBIDDEN";
}

export type IntakeDecision = "OK" | "FORBIDDEN";
