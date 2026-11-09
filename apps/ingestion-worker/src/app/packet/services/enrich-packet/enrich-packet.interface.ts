export interface Packet {
  deviceId: string;
  timestamp: string;
  intervalSeconds: number;
  readings: number[];
  savedData: boolean;
}

export interface SamplePoint {
  kind: "sample";
  deviceId: string;
  sampleTime: Date;
  temperature: number;
  isDelayedPacket: boolean;
}

export interface AnomalyPoint {
  kind: "anomaly";
  deviceId: string;
  sampleTime: Date;
  temperature: number;
  reason: "OUT_OF_RANGE";
}

export type EnrichedPoint = SamplePoint | AnomalyPoint;
