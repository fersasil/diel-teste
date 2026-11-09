export type NetworkSort = "store" | "environment" | "comfort" | "device";
export type NetworkPeriod = "1d" | "7d" | "30d";

export interface NetworkQuery {
  page?: number;
  storeId?: string;
  environmentName?: string;
  comfortStatus?: string;
  deviceStatus?: string;
  sort?: NetworkSort | "";
  dir?: "asc" | "desc" | "";
  period?: NetworkPeriod;
}

const SORT_COLUMNS: NetworkSort[] = ["store", "environment", "comfort", "device"];
const PERIODS: NetworkPeriod[] = ["1d", "7d", "30d"];

export function parseNetworkPeriod(value?: string): NetworkPeriod {
  return PERIODS.find((item) => item === value) ?? "1d";
}

export function parseNetworkSort(sort?: string, dir?: string): Pick<NetworkQuery, "sort" | "dir"> {
  const column = SORT_COLUMNS.find((item) => item === sort);
  if (!column) {
    return { sort: "", dir: "" };
  }
  return { sort: column, dir: dir === "desc" ? "desc" : "asc" };
}

export function nextNetworkSort(column: NetworkSort, query: NetworkQuery): Pick<NetworkQuery, "sort" | "dir"> {
  if (query.sort !== column) {
    return { sort: column, dir: "asc" };
  }
  if (query.dir !== "desc") {
    return { sort: column, dir: "desc" };
  }
  return { sort: "", dir: "" };
}

export function networkHref(query: NetworkQuery): string {
  const params = new URLSearchParams();
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.storeId) {
    params.set("storeId", query.storeId);
  }
  if (query.environmentName) {
    params.set("environmentName", query.environmentName);
  }
  if (query.comfortStatus) {
    params.set("comfortStatus", query.comfortStatus);
  }
  if (query.deviceStatus) {
    params.set("deviceStatus", query.deviceStatus);
  }
  if (query.period && query.period !== "1d") {
    params.set("period", query.period);
  }
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.dir === "desc" ? "desc" : "asc");
  }
  const text = params.toString();
  return text ? `/rede?${text}` : "/rede";
}
