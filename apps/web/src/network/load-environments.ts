import { serverApiBase } from "../shared/api-base";
import { kindFromStatus } from "../shared/load-state";
import type { NetworkQuery } from "./network-query";

export interface EnvironmentListItem {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  comfortStatus: "IN_RANGE" | "ABOVE" | "BELOW" | "NO_DATA";
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
  comfortPercent: number | null;
  outOfRangeEnvCount: number;
  lastSeenAt: string | null;
}

export interface EnvironmentPage {
  items: EnvironmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  code?: string;
}

export async function loadEnvironments(
  token: string,
  query: NetworkQuery,
  pageSize = 10,
): Promise<EnvironmentPage | "session" | "failure" | "focus"> {
  try {
    const params = new URLSearchParams({
      page: String(query.page && query.page > 0 ? query.page : 1),
      pageSize: String(pageSize),
    });
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
    if (query.sort) {
      params.set("sort", query.sort);
      params.set("dir", query.dir === "desc" ? "desc" : "asc");
    }
    params.set("period", query.period ?? "1d");
    const response = await fetch(`${serverApiBase()}/api/v1/environments?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as EnvironmentPage;
    const kind = kindFromStatus(response.status, body.code);
    if (kind === "ok") {
      return {
        items: body.items ?? [],
        total: body.total ?? 0,
        page: body.page ?? Number(params.get("page")),
        pageSize: body.pageSize ?? pageSize,
      };
    }
    if (kind === "session" || kind === "focus") {
      return kind;
    }
    return "failure";
  } catch {
    return "failure";
  }
}
