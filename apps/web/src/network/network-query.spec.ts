import { networkHref, nextNetworkSort, parseNetworkSort } from "./network-query";

describe("networkHref", () => {
  it("drops empty filters and the first page", () => {
    expect(networkHref({ page: 1 })).toBe("/rede");
    expect(networkHref({ page: 2, storeId: "LOJA-SP-001", comfortStatus: "NO_DATA" })).toBe(
      "/rede?page=2&storeId=LOJA-SP-001&comfortStatus=NO_DATA",
    );
    expect(networkHref({ sort: "store", dir: "desc" })).toBe("/rede?sort=store&dir=desc");
    expect(networkHref({ period: "7d" })).toBe("/rede?period=7d");
    expect(networkHref({ period: "1d" })).toBe("/rede");
    expect(networkHref({ deviceStatus: "OFFLINE" })).toBe("/rede?deviceStatus=OFFLINE");
    expect(parseNetworkSort("device", "desc")).toEqual({ sort: "device", dir: "desc" });
    expect(parseNetworkSort("nope", "desc")).toEqual({ sort: "", dir: "" });
    expect(nextNetworkSort("store", {})).toEqual({ sort: "store", dir: "asc" });
    expect(nextNetworkSort("store", { sort: "store", dir: "asc" })).toEqual({ sort: "store", dir: "desc" });
    expect(nextNetworkSort("store", { sort: "store", dir: "desc" })).toEqual({ sort: "", dir: "" });
  });
});
