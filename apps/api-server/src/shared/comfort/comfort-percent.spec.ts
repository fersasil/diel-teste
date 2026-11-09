import { comfortPercent } from "./comfort-percent";

describe("comfort percent", () => {
  it("divides the covered time by the operating time", () => {
    expect(comfortPercent(1800, 3600)).toBe(0.5);
  });

  it("caps the result when the covered time exceeds the shift", () => {
    expect(comfortPercent(4000, 3600)).toBe(1);
  });

  it("returns null when the place is closed", () => {
    expect(comfortPercent(30, 0)).toBeNull();
  });
});
