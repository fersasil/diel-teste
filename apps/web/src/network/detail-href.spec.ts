import { detailHref } from "./detail-href";

describe("detail href", () => {
  it("keeps the operating-hours toggle in the address", () => {
    expect(detailHref("AMB-006", "30d", "1mo", { from: "2026-01-01", to: "2026-02-10", operating: true }))
      .toBe("/ambientes/AMB-006?bucket=1mo&hours=expediente&from=2026-01-01&to=2026-02-10");
  });

  it("omits the toggle when the full day is shown", () => {
    expect(detailHref("AMB-006", "30d", "1mo")).toBe("/ambientes/AMB-006?bucket=1mo&period=30d");
  });
});
