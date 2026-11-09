import { Injectable } from "@nestjs/common";
import { ClientRepository, type ClientListSort } from "../../repositories/client.repository";
import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { searchFragment } from "../../../../shared/search/search-fragment";
import type { ClientPage } from "./list-clients.interface";

export type { ClientPage } from "./list-clients.interface";

const SORT_COLUMNS: ClientListSort[] = ["name", "segment"];

export function parseClientPage(query: { page?: string; pageSize?: string }): {
  page: number;
  pageSize: number;
} {
  const pageNumber = Number(query.page ?? "1");
  const sizeNumber = Number(query.pageSize ?? "10");
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const pageSize = Number.isInteger(sizeNumber) && sizeNumber > 0
    ? Math.min(sizeNumber, 100)
    : 10;
  return { page, pageSize };
}

export function parseClientSort(query: { sort?: string; dir?: string }): {
  sort?: ClientListSort;
  dir: "asc" | "desc";
} {
  const sort = SORT_COLUMNS.find((item) => item === query.sort);
  return { sort, dir: query.dir === "desc" ? "desc" : "asc" };
}

@Injectable()
export class ListClientsService {
  private readonly clients = new ClientRepository();

  async execute(
    scope: AccessScope,
    query: { page?: string; pageSize?: string; q?: string; sort?: string; dir?: string },
  ): Promise<ClientPage> {
    const { page, pageSize } = parseClientPage(query);
    if (scope.profile !== "diel_operator") {
      return { page, pageSize, total: 0, items: [], code: "FORBIDDEN" };
    }
    const { sort, dir } = parseClientSort(query);
    const listed = await this.clients.list({
      query: searchFragment(query.q),
      sort,
      dir,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { page, pageSize, total: listed.total, items: listed.items };
  }
}
