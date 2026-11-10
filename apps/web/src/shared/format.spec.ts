import { formatChartTick, formatDataVolume, formatInstant, formatOperatingHours, formatPercent, formatReadingAt, formatTemperature, localDay } from "./format";

describe("format", () => {
  it("prints the period comfort as a percent", () => {
    expect(formatPercent(0.876)).toBe("88%");
    expect(formatPercent(null)).toBe("—");
  });

  it("prints megabytes by default and gigabytes when asked", () => {
    expect(formatDataVolume(1_128_000, "mb", 3)).toBe("1,128");
    expect(formatDataVolume(1_479, "mb", 6)).toBe("0,001479");
    expect(formatDataVolume(1_128_000, "gb", 6)).toBe("0,001128");
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

  it("prints the days the comfort percent counts", () => {
    expect(formatOperatingHours({
      mon: [["08:00", "18:00"]],
      tue: [["08:00", "18:00"]],
      wed: [["08:00", "18:00"]],
      thu: [["08:00", "18:00"]],
      fri: [["08:00", "18:00"]],
      sat: [],
      sun: [],
    })).toBe("segunda a sexta, 08:00–18:00");
    expect(formatOperatingHours({
      mon: [["09:00", "20:00"]],
      tue: [["09:00", "20:00"]],
      wed: [["09:00", "20:00"]],
      thu: [["09:00", "20:00"]],
      fri: [["09:00", "20:00"]],
      sat: [["09:00", "18:00"]],
      sun: [],
    })).toBe("segunda a sexta, 09:00–20:00 · sábado, 09:00–18:00");
    expect(formatOperatingHours({
      mon: [["00:00", "24:00"]],
      tue: [["00:00", "24:00"]],
      wed: [["00:00", "24:00"]],
      thu: [["00:00", "24:00"]],
      fri: [["00:00", "24:00"]],
      sat: [["00:00", "24:00"]],
      sun: [["00:00", "24:00"]],
    })).toBe("todos os dias, 00:00–24:00");
  });

  it("does not turn a missing temperature into a number", () => {
    expect(formatTemperature(null)).toBeNull();
  });
});
