import { serverApiBase } from "../shared/api-base";
import type { StoreCardData } from "../components/store-card";
import { kindFromStatus } from "../shared/load-state";
import type { NetworkQuery } from "./network-query";

export interface StorePage {
  items: StoreCardData[];
  total: number;
  page: number;
  pageSize: number;
  code?: string;
}

export async function loadStores(
  token: string,
  query: NetworkQuery,
  pageSize = 10,
): Promise<StorePage | "session" | "failure" | "focus"> {
  try {
    const params = new URLSearchParams({
      page: String(query.page && query.page > 0 ? query.page : 1),
      pageSize: String(pageSize),
      period: query.period ?? "1d",
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
    if (query.sort) {
      params.set("sort", query.sort);
      params.set("dir", query.dir === "desc" ? "desc" : "asc");
    }
    const response = await fetch(`${serverApiBase()}/api/v1/stores?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as StorePage;
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
