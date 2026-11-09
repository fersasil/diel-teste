import { resolveBucket, validateRange } from "../../src/app/environment/services/timeseries-bucket/timeseries-bucket.service";

describe("timeseries", () => {
  it("opens on 30 minutes and rejects an unknown bucket or a long window", () => {
    expect(resolveBucket(undefined)).toBe("30m");
    expect(resolveBucket("1h")).toBe("1h");
    expect(resolveBucket("2h")).toBe("INVALID_BUCKET");
    const from = new Date("2026-01-01T00:00:00Z");
    expect(validateRange(from, new Date("2026-03-01T00:00:00Z"))).toBe("OK");
    expect(validateRange(from, new Date("2025-12-01T00:00:00Z"))).toBe("INVALID_RANGE");
  });
});
