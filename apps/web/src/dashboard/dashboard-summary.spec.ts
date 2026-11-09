import { environmentCountOf } from "./dashboard-summary";

describe("environmentCountOf", () => {
  it("adds the four comfort buckets of one store", () => {
    expect(
      environmentCountOf({
        id: "LOJA-RJ-001",
        name: "Loja Tijuca",
        inRangeCount: 0,
        aboveCount: 1,
        belowCount: 0,
        noDataCount: 6,
        onlineCount: 1,
        offlineCount: 0,
      }),
    ).toBe(7);
  });
});
