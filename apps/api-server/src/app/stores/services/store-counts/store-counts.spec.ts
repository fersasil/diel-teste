import { countEnvironments } from "./store-counts.service";

describe("countEnvironments", () => {
  it("counts no data only when lastSeenAt is null and comfort otherwise", () => {
    const counts = countEnvironments([
      { lastSeenAt: null, lastComfortStatus: null },
      { lastSeenAt: new Date("2026-11-04T18:00:00Z"), lastComfortStatus: "IN_RANGE" },
      { lastSeenAt: new Date("2026-11-04T18:00:00Z"), lastComfortStatus: "ABOVE" },
      { lastSeenAt: new Date("2026-11-04T18:00:00Z"), lastComfortStatus: "BELOW" },
    ]);

    expect(counts).toEqual({
      inRangeCount: 1,
      aboveCount: 1,
      belowCount: 1,
      noDataCount: 1,
    });
    const total =
      counts.inRangeCount + counts.aboveCount + counts.belowCount + counts.noDataCount;
    expect(total).toBe(4);
  });
});
