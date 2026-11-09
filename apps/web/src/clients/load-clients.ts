import { serverApiBase } from "../shared/api-base";
import type { ClientQuery } from "./client-query";
import { kindFromStatus } from "../shared/load-state";

export interface ClientListItem {
  id: string;
  name: string;
  segment: string;
}

export interface ClientPage {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  code?: string;
}

export async function loadClients(
  token: string,
  query: ClientQuery,
  pageSize = 10,
): Promise<ClientPage | "session" | "failure" | "focus"> {
  try {
    const params = new URLSearchParams({
      page: String(query.page && query.page > 0 ? query.page : 1),
      pageSize: String(pageSize),
    });
    if (query.q) {
      params.set("q", query.q);
    }
    if (query.sort) {
      params.set("sort", query.sort);
      params.set("dir", query.dir === "desc" ? "desc" : "asc");
    }
    const response = await fetch(`${serverApiBase()}/api/v1/clients?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ClientPage;
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
