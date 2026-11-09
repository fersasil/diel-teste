import { serverApiBase } from "../shared/api-base";
import { kindFromStatus } from "../shared/load-state";
import type { NetworkQuery } from "./network-query";

export interface FilterOptions {
  stores: Array<{ id: string; name: string }>;
  environmentNames: string[];
  code?: string;
}

export async function loadFilterOptions(
  token: string,
  query: NetworkQuery,
): Promise<FilterOptions | "session" | "failure" | "focus"> {
  try {
    const params = new URLSearchParams({ limit: "20" });
    if (query.storeId) {
      params.set("storeId", query.storeId);
    }
    if (query.environmentName) {
      params.set("selectedName", query.environmentName);
    }
    const response = await fetch(`${serverApiBase()}/api/v1/environments/options?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as FilterOptions;
    const kind = kindFromStatus(response.status, body.code);
    if (kind === "ok") {
      return {
        stores: body.stores ?? [],
        environmentNames: body.environmentNames ?? [],
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
