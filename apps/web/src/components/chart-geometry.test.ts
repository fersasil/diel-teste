import { axisTicks, bounds, labelIndexes, ribbon } from "./chart-geometry";
import type { PlotFrame } from "./chart-geometry";

describe("chart geometry", () => {
  it("keeps the comfort band from filling the whole plot", () => {
    const span = bounds([], 21, 25);
    expect(span.min).toBeLessThan(21);
    expect(span.max).toBeGreaterThan(25);
    const band = (25 - 21) / (span.max - span.min);
    expect(band).toBeLessThan(0.7);
  });

  it("leaves a small margin around the samples", () => {
    const span = bounds([18, 28], 21, 24);
    expect((28 - 18) / (span.max - span.min)).toBeGreaterThan(0.7);
  });

  it("fills the min-max ribbon only where both samples exist", () => {
    const frame: PlotFrame = { width: 100, height: 80, left: 10, right: 10, top: 8, bottom: 12 };
    const paths = ribbon([20, 21, null], [24, 25, null], 3, { min: 18, max: 26 }, frame);
    expect(paths).toHaveLength(1);
    expect(paths[0].split(" ")).toHaveLength(4);
  });

  it("labels the scale on whole degrees", () => {
    expect(axisTicks({ min: 19.3, max: 28.9 })).toEqual([20, 22, 24, 26, 28]);
  });

  it("picks unique label indexes including the ends", () => {
    expect(labelIndexes(48)).toEqual([0, 16, 31, 47]);
    expect(labelIndexes(1)).toEqual([0]);
  });
});
