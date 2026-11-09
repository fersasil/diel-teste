import { formatChartTick, formatInstant, formatPercent, formatReadingAt, formatTemperature, localDay } from "./format";

describe("format", () => {
  it("prints the period comfort as a percent", () => {
    expect(formatPercent(0.876)).toBe("88%");
    expect(formatPercent(null)).toBe("—");
  });

  it("prints one decimal and the celsius unit", () => {
    expect(formatTemperature(22)).toBe("22.0 °C");
    expect(formatTemperature(21.26)).toBe("21.3 °C");
  });

  it("prints the local day for the date picker", () => {
    expect(localDay("2026-02-10T18:00:00.000Z", "America/Sao_Paulo")).toBe("2026-02-10");
  });

  it("formats the instant in the store timezone", () => {
    const label = formatInstant("2026-01-12T12:00:00.000Z", "America/Sao_Paulo");
    expect(label).toContain("09:00");
    expect(label).not.toContain("Z");
  });

  it("prints the last reading with the local year", () => {
    const label = formatReadingAt("2026-02-11T02:54:43.000Z", "America/Sao_Paulo");
    expect(label).toContain("10/02/2026");
    expect(label).toContain("23:54");
  });

  it("splits chart ticks into day and time", () => {
    const tick = formatChartTick("2026-01-12T12:00:00.000Z", "America/Sao_Paulo");
    expect(tick.day).toBe("12/01");
    expect(tick.time).toBe("09:00");
  });

  it("does not turn a missing temperature into a number", () => {
    expect(formatTemperature(null)).toBeNull();
  });
});
