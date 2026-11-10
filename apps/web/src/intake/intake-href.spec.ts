import { intakeHref } from "./intake-href";

describe("intake href", () => {
  it("opens on megabytes and the first page", () => {
    expect(intakeHref({ page: 1, unit: "mb" })).toBe("/entrada");
  });

  it("keeps the page when the unit changes", () => {
    expect(intakeHref({ page: 2, unit: "gb" })).toBe("/entrada?unit=gb&page=2");
  });
});