import type { EnrichedPoint, Packet } from "./enrich-packet.interface";

export type { AnomalyPoint, EnrichedPoint, Packet, SamplePoint } from "./enrich-packet.interface";

export function enrichPacket(packet: Packet): EnrichedPoint[] {
  const count = packet.readings.length;
  const newest = new Date(packet.timestamp).getTime();
  return packet.readings.map((temperature, index) => {
    const sampleTime = new Date(
      newest - (count - 1 - index) * packet.intervalSeconds * 1000,
    );

    if (temperature < -10 || temperature > 60) {
      return {
        kind: "anomaly",
        deviceId: packet.deviceId,
        sampleTime,
        temperature,
        reason: "OUT_OF_RANGE" as const,
      };
    }

    return {
      kind: "sample",
      deviceId: packet.deviceId,
      sampleTime,
      temperature,
      isDelayedPacket: packet.savedData,
    };
  });
}

