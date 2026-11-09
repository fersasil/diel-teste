import { clientHref, nextClientSort, parseClientQuerySort } from "./client-query";

describe("clientHref", () => {
  it("drops empty search and the first page", () => {
    expect(clientHref({ page: 1 })).toBe("/entrar/foco");
    expect(clientHref({ page: 2, q: "Moda", sort: "name", dir: "desc" })).toBe(
      "/entrar/foco?page=2&q=Moda&sort=name&dir=desc",
    );
    expect(parseClientQuerySort("segment", "desc")).toEqual({ sort: "segment", dir: "desc" });
    expect(nextClientSort("name", { sort: "name", dir: "desc" })).toEqual({ sort: "", dir: "" });
  });
});
