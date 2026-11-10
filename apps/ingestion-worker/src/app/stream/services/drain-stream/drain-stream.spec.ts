import { concurrencyForBacklog, drainInOrder, drainMessages } from "./drain-stream.service";
import { shouldDeadLetter, shouldMqttAck } from "../ack-gate/ack-gate.service";

describe("drain stream", () => {
  it("raises concurrency while the stream is behind", () => {
    expect(concurrencyForBacklog(0)).toBe(8);
    expect(concurrencyForBacklog(500)).toBe(16);
    expect(concurrencyForBacklog(5000)).toBe(32);
  });

  it("persists a batch in arrival order", async () => {
    const seen: string[] = [];

    await drainInOrder(
      [{ id: "1-0", payload: "first" }, { id: "2-0", payload: "second" }],
      async (line) => {
        if (line === "first") {
          await new Promise((resolve) => setTimeout(resolve, 15));
        }

        seen.push(line);
        return true;
      },

      async () => undefined,
      async () => undefined,
      async () => 1,
    );
    expect(seen).toEqual(["first", "second"]);
  });

  it("acks mqtt only after the stream write", () => {
    expect(shouldMqttAck(true)).toBe(true);
    expect(shouldMqttAck(false)).toBe(false);
  });

  it("acks the stream after persist and dead-letters after five fails", async () => {
    expect(shouldDeadLetter(5)).toBe(false);
    expect(shouldDeadLetter(6)).toBe(true);
    const acked: string[] = [];
    const dead: string[] = [];
    const fails = new Map<string, number>();

    await drainMessages(
      [{ id: "1-0", payload: "ok" }, { id: "2-0", payload: "bad" }],
      async (line) => line === "ok",
      async (id) => {
        acked.push(id);
      },

      async (id) => {
        dead.push(id);
      },

      async (id) => {
        const next = (fails.get(id) ?? 0) + 1;
        fails.set(id, next);
        return next;
      },
    );
    expect(acked).toEqual(["1-0"]);
    expect(dead).toEqual([]);
    await drainMessages(
      [{ id: "2-0", payload: "bad" }],
      async () => false,
      async () => undefined,
      async (id) => {
        dead.push(id);
      },

      async () => 6,
    );
    expect(dead).toEqual(["2-0"]);
  });
});
