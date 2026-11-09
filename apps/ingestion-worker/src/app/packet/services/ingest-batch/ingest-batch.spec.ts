import { laneOf } from "./ingest-batch.service";

describe("ingest lanes", () => {
  it("keeps one device on the same lane", () => {
    expect(laneOf("IOT001")).toBe(laneOf("IOT001"));
    expect(laneOf("IOT001")).toBeGreaterThanOrEqual(0);
    expect(laneOf("IOT099")).toBeLessThan(4);
  });
});