import { parseAlertLimit } from "./get-dashboard-summary.service";

describe("dashboard summary", () => {
  it("caps the alert store list", () => {
    expect(parseAlertLimit(undefined)).toBe(10);
    expect(parseAlertLimit("500")).toBe(20);
    expect(parseAlertLimit("0")).toBe(10);
  });
});
