import { Injectable } from "@nestjs/common";
import { StoreListRepository, type StoreListSort } from "../../repositories/store-list.repository";
import { scopeClientId, type AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { comfortPercent } from "../../../../shared/comfort/comfort-percent";
import { parseComfortFilter } from "../../../environment/services/list-environments/list-environments.service";
import { searchFragment } from "../../../../shared/search/search-fragment";
import { parsePeriod, periodRange } from "../../../../shared/time/parse-period";
import type { StorePage } from "./list-stores.interface";

export type { StorePage } from "./list-stores.interface";

const SORT_COLUMNS: StoreListSort[] = ["store", "comfort", "outOfRange", "device"];

export function parsePage(query: { page?: string; pageSize?: string }): {
  page: number;
  pageSize: number;
} {
  const pageNumber = Number(query.page ?? "1");
  const sizeNumber = Number(query.pageSize ?? "50");
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const pageSize = Number.isInteger(sizeNumber) && sizeNumber > 0
    ? Math.min(sizeNumber, 100)
    : 50;
  return { page, pageSize };
}

export function parseStoreSort(query: { sort?: string; dir?: string }): {
  sort?: StoreListSort;
  dir: "asc" | "desc";
} {
  const sort = SORT_COLUMNS.find((item) => item === query.sort);
  return { sort, dir: query.dir === "desc" ? "desc" : "asc" };
}

@Injectable()
export class ListStoresService {
  private readonly stores = new StoreListRepository();

  async execute(
    scope: AccessScope,
    query: {
      page?: string;
      pageSize?: string;
      q?: string;
      storeId?: string;
      environmentName?: string;
      comfortStatus?: string;
      sort?: string;
      dir?: string;
      period?: string;
    },
    virtualNow = new Date(),
  ): Promise<StorePage> {
    const { page, pageSize } = parsePage(query);
    const { sort, dir } = parseStoreSort(query);
    const range = periodRange(parsePeriod(query.period), virtualNow);
    const clientId = scopeClientId(scope);

    if (!clientId) {
      return { page, pageSize, total: 0, items: [], code: "CLIENT_FOCUS_REQUIRED" };
    }

    const listed = await this.stores.list({
      clientId,
      allowedStoreIds: scope.profile === "store_manager" ? scope.allowedStoreIds : null,
      query: searchFragment(query.q),
      storeId: query.storeId || undefined,
      environmentName: query.environmentName || undefined,
      comfortStatus: parseComfortFilter(query.comfortStatus),
      sort,
      dir,
      from: range.from,
      to: range.to,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      virtualNow,
    });
    return {
      page,
      pageSize,
      total: listed.total,
      items: listed.items.map((item) => ({
        ...item,
        comfortPercent: comfortPercent(item.inRangeSeconds, item.operatingSeconds),
      })),
    };
  }
}
