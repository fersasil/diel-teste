import { enrichPacket } from "../../src/app/packet/services/enrich-packet/enrich-packet.service";
import { shouldAck, shouldMqttAck } from "../../src/app/stream/services/ack-gate/ack-gate.service";
import { nextVirtualNow } from "../../src/app/clock/services/advance-clock/advance-clock.service";
import { consumeBatch } from "../../src/app/packet/services/consume-batch/consume-batch.service";

describe("ingestion", () => {
  it("acks only after both writes and keeps one row on replay", async () => {
    const packet = {
      deviceId: "dev-1",
      timestamp: "2026-11-04T18:00:00Z",
      intervalSeconds: 60,
      readings: [60],
      savedData: true,
    };
    const first = enrichPacket(packet);
    const second = enrichPacket(packet);
    expect(first).toEqual(second);
    expect(shouldAck(false, true)).toBe(false);
    expect(shouldAck(true, true)).toBe(true);
    expect(shouldMqttAck(true)).toBe(true);
    expect(shouldMqttAck(false)).toBe(false);
    const stored: string[] = [];
    const result = await consumeBatch([packet], ["raw"], async (key) => {
      stored.push(key);
    }, async () => undefined);

    expect(result.acked).toBe(true);
    expect(stored).toHaveLength(1);
    const failed = await consumeBatch([packet], ["raw"], async () => {
      throw new Error("minio down");
    }, async () => undefined);

    expect(failed.acked).toBe(false);
    const clock = nextVirtualNow(new Date("2026-11-04T18:00:00Z"), new Date("2026-11-04T17:00:00Z"));
    expect(clock.toISOString()).toBe("2026-11-04T18:00:00.000Z");
  });
});
