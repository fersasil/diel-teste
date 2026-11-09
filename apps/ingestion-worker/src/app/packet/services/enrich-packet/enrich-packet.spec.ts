import { enrichPacket } from "./enrich-packet.service";

describe("enrichPacket", () => {
  it("unrolls from oldest to newest and keeps the bounds inclusive", () => {
    const points = enrichPacket({
      deviceId: "dev-1",
      timestamp: "2026-11-04T18:00:00Z",
      intervalSeconds: 60,
      readings: [-10, 80, 60],
      savedData: true,
    });
    expect(points[0]?.sampleTime.toISOString()).toBe("2026-11-04T17:58:00.000Z");
    expect(points[2]?.sampleTime.toISOString()).toBe("2026-11-04T18:00:00.000Z");
    expect(points[0]?.kind).toBe("sample");
    expect(points[1]).toMatchObject({ kind: "anomaly", reason: "OUT_OF_RANGE" });
    expect(points[2]).toMatchObject({ kind: "sample", isDelayedPacket: true, temperature: 60 });
  });
});
