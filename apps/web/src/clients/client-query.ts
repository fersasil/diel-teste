export type ClientSort = "name" | "segment";

export interface ClientQuery {
  page?: number;
  q?: string;
  sort?: ClientSort | "";
  dir?: "asc" | "desc" | "";
}

const SORT_COLUMNS: ClientSort[] = ["name", "segment"];

export function parseClientQuerySort(sort?: string, dir?: string): Pick<ClientQuery, "sort" | "dir"> {
  const column = SORT_COLUMNS.find((item) => item === sort);
  if (!column) {
    return { sort: "", dir: "" };
  }
  return { sort: column, dir: dir === "desc" ? "desc" : "asc" };
}

export function nextClientSort(column: ClientSort, query: ClientQuery): Pick<ClientQuery, "sort" | "dir"> {
  if (query.sort !== column) {
    return { sort: column, dir: "asc" };
  }
  if (query.dir !== "desc") {
    return { sort: column, dir: "desc" };
  }
  return { sort: "", dir: "" };
}

export function clientHref(query: ClientQuery): string {
  const params = new URLSearchParams();
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.q) {
    params.set("q", query.q);
  }
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.dir === "desc" ? "desc" : "asc");
  }
  const text = params.toString();
  return text ? `/entrar/foco?${text}` : "/entrar/foco";
}
