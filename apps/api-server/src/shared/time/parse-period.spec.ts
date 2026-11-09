import { parsePeriod, periodRange } from "./parse-period";

describe("parsePeriod", () => {
  it("defaults to the last day and accepts week and month windows", () => {
    expect(parsePeriod(undefined)).toBe("1d");
    expect(parsePeriod("7d")).toBe("7d");
    expect(parsePeriod("30d")).toBe("30d");
    expect(parsePeriod("year")).toBe("1d");
    const now = new Date("2026-02-10T23:59:56.000Z");
    expect(periodRange("1d", now)).toEqual({
      from: new Date("2026-02-09T23:59:56.000Z"),
      to: now,
    });
  });
});
