import { resolveBucket, validateRange } from "./timeseries-bucket.service";

describe("timeseries bucket", () => {
  it("defaults to 30m and rejects a quarter hour", () => {
    expect(resolveBucket()).toBe("30m");
    expect(resolveBucket("")).toBe("30m");
    expect(resolveBucket("15m")).toBe("INVALID_BUCKET");
    expect(resolveBucket("30m")).toBe("30m");
    expect(resolveBucket("1h")).toBe("1h");
    expect(resolveBucket("1d")).toBe("1d");
    expect(resolveBucket("1w")).toBe("1w");
    expect(resolveBucket("1mo")).toBe("1mo");
    expect(resolveBucket("5m")).toBe("INVALID_BUCKET");
  });

  it("accepts a long window and rejects an inverted one", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    expect(validateRange(from, new Date("2026-04-04T00:00:00Z"))).toBe("OK");
    expect(validateRange(from, new Date("2025-12-01T00:00:00Z"))).toBe("INVALID_RANGE");
    expect(validateRange(new Date("invalid"), from)).toBe("INVALID_RANGE");
  });
});
