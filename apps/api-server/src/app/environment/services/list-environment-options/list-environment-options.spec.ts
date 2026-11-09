import { parseOptionsLimit, searchFragment } from "./list-environment-options.service";

describe("list environment options", () => {
  it("caps the suggestion list", () => {
    expect(parseOptionsLimit(undefined)).toBe(20);
    expect(parseOptionsLimit("500")).toBe(50);
    expect(parseOptionsLimit("0")).toBe(20);
  });

  it("escapes like wildcards so the user cannot broaden the scan", () => {
    expect(searchFragment("  Estoque_%  ")).toBe("Estoque\\_\\%");
    expect(searchFragment("")).toBeUndefined();
  });
});
