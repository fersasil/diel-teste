import { parseClientPage, parseClientSort } from "./list-clients.service";

describe("list clients", () => {
  it("defaults to page 1 and 10 rows, and caps pageSize at 100", () => {
    expect(parseClientPage({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseClientPage({ page: "2", pageSize: "500" })).toEqual({ page: 2, pageSize: 100 });
  });

  it("accepts only known sort columns", () => {
    expect(parseClientSort({})).toEqual({ sort: undefined, dir: "asc" });
    expect(parseClientSort({ sort: "segment", dir: "desc" })).toEqual({ sort: "segment", dir: "desc" });
    expect(parseClientSort({ sort: "drop table", dir: "up" })).toEqual({ sort: undefined, dir: "asc" });
  });
});
