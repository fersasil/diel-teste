import { alignExternalWeather } from "./align-external-weather.service";

describe("align external weather", () => {
  it("places the city hour on every indoor bucket of that hour", () => {
    const aligned = alignExternalWeather(
      [
        { bucketStart: "2026-02-10T15:00:00.000Z" },
        { bucketStart: "2026-02-10T15:30:00.000Z" },
        { bucketStart: "2026-02-10T16:00:00.000Z" },
      ],
      [
        { bucketStart: "2026-02-10T15:00:00.000Z", avgTemp: 27.2 },
        { bucketStart: "2026-02-10T17:00:00.000Z", avgTemp: 26 },
      ],
    );
    expect(aligned.map((point) => point.avgTemp)).toEqual([27.2, 27.2, null]);
  });

  it("averages the city hours inside a day", () => {
    const aligned = alignExternalWeather(
      [{ bucketStart: "2026-02-10T03:00:00.000Z" }],
      [
        { bucketStart: "2026-02-10T03:00:00.000Z", avgTemp: 20 },
        { bucketStart: "2026-02-10T04:00:00.000Z", avgTemp: 22 },
        { bucketStart: "2026-02-11T03:00:00.000Z", avgTemp: 30 },
      ],
      "1d",
    );
    expect(aligned.map((point) => point.avgTemp)).toEqual([21]);
  });

  it("returns no series when the city has no hours", () => {
    expect(alignExternalWeather([{ bucketStart: "2026-02-10T15:00:00.000Z" }], [])).toEqual([]);
  });
});
