import { trafficBytes } from "./traffic-bytes";

describe("traffic bytes", () => {
  it("turns the published file back into its byte size", () => {
    expect(trafficBytes(180_951 * 12, 0).totalBytes).toBe(28_414_325);
  });

  it("counts only the last hour toward the rate", () => {
    const hour = trafficBytes(12_000, 120);
    expect(hour.bytesPerHour).toBe(Math.round(120 * (28_414_325 / (180_951 * 12))));
    expect(hour.totalBytes).toBeGreaterThan(hour.bytesPerHour);
  });
});
