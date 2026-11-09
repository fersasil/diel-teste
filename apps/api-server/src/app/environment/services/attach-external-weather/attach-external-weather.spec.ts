import { attachExternalWeather } from "./attach-external-weather.service";

describe("attachExternalWeather", () => {
  it("keeps the indoor comfort bounds and accepts an empty external series", () => {
    const detail = { comfortMin: 20, comfortMax: 24, name: "Sala" };
    const attached = attachExternalWeather(detail, []);
    expect(attached.comfortMin).toBe(20);
    expect(attached.comfortMax).toBe(24);
    expect(attached.external).toEqual([]);
  });
});
