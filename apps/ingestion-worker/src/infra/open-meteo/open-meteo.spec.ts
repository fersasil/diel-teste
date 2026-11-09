import { readingsFromOpenMeteo, weatherCovers } from "./open-meteo";

describe("open meteo", () => {
  it("reads hourly temperatures and ignores blanks", () => {
    const readings = readingsFromOpenMeteo({
      hourly: {
        time: ["2026-02-10T00:00", "2026-02-10T01:00", "2026-02-10T01:00", "nope"],
        temperature_2m: [26.4, 25.1, 25.1, null],
      },
    });
    expect(readings).toEqual([
      { readingTime: new Date("2026-02-10T00:00:00.000Z"), temperature: 26.4 },
      { readingTime: new Date("2026-02-10T01:00:00.000Z"), temperature: 25.1 },
    ]);
  });

  it("rejects a payload without the hourly series", () => {
    expect(readingsFromOpenMeteo({ hourly: {} })).toBeNull();
    expect(readingsFromOpenMeteo(null)).toBeNull();
  });

  it("skips a city whose stored hours already cover the samples", () => {
    const span = { from: new Date("2026-01-12T03:00:01.000Z"), to: new Date("2026-04-04T12:21:01.000Z") };
    expect(weatherCovers(span, {
      from: new Date("2026-01-12T00:00:00.000Z"),
      to: new Date("2026-04-04T23:00:00.000Z"),
    })).toBe(true);
    expect(weatherCovers(span, { from: new Date("2026-02-01T00:00:00.000Z"), to: span.to })).toBe(false);
    expect(weatherCovers(span, null)).toBe(false);
  });
});
