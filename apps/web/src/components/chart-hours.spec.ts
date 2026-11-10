import { plottedTemperatures } from "./chart-hours";

describe("operating hours on the chart", () => {
  const point = {
    avgTemp: 28,
    minTemp: 18,
    maxTemp: 34,
    operatingAvgTemp: 23.5,
    operatingMinTemp: 22.1,
    operatingMaxTemp: 24.8,
  };

  it("keeps the full reading until the toggle is on", () => {
    expect(plottedTemperatures(point, false)).toEqual(point);
  });

  it("plots only the scheduled hours when the toggle is on", () => {
    expect(plottedTemperatures(point, true)).toMatchObject({
      avgTemp: 23.5,
      minTemp: 22.1,
      maxTemp: 24.8,
    });
  });

  it("leaves a closed bucket blank", () => {
    const closed = plottedTemperatures({
      ...point,
      operatingAvgTemp: null,
      operatingMinTemp: null,
      operatingMaxTemp: null,
    }, true);
    expect(closed.avgTemp).toBeNull();
    expect(closed.minTemp).toBeNull();
    expect(closed.maxTemp).toBeNull();
  });
});
