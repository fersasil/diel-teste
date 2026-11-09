import { parseComfortFilter, parseEnvironmentPage, parseEnvironmentSort, presentEnvironment } from "./list-environments.service";

describe("list environments", () => {
  it("defaults to page 1 and 10 rows, and caps pageSize at 100", () => {
    expect(parseEnvironmentPage({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseEnvironmentPage({ page: "2", pageSize: "500" })).toEqual({ page: 2, pageSize: 100 });
  });

  it("marks missing telemetry as no data", () => {
    const now = new Date("2026-04-03T12:00:00.000Z");
    expect(presentEnvironment({ lastComfortStatus: "ABOVE", lastSeenAt: null }, now)).toEqual({
      comfortStatus: "NO_DATA",
      deviceStatus: "NO_DATA",
    });
  });

  it("accepts only known sort columns", () => {
    expect(parseEnvironmentSort({})).toEqual({ sort: undefined, dir: "asc" });
    expect(parseEnvironmentSort({ sort: "store", dir: "desc" })).toEqual({ sort: "store", dir: "desc" });
    expect(parseEnvironmentSort({ sort: "drop table", dir: "up" })).toEqual({ sort: undefined, dir: "asc" });
  });

  it("accepts only known comfort filters", () => {
    expect(parseComfortFilter("NO_DATA")).toBe("NO_DATA");
    expect(parseComfortFilter("ABOVE")).toBe("ABOVE");
    expect(parseComfortFilter("2h")).toBeUndefined();
  });

  it("keeps the last comfort status when the device was seen", () => {
    const now = new Date("2026-04-03T12:00:00.000Z");
    const seen = new Date("2026-04-03T11:50:00.000Z");
    expect(presentEnvironment({ lastComfortStatus: "ABOVE", lastSeenAt: seen }, now)).toEqual({
      comfortStatus: "ABOVE",
      deviceStatus: "ONLINE",
    });
  });
});
