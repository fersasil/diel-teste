import { Injectable } from "@nestjs/common";
import { EnvironmentListRepository } from "../../repositories/environment-list.repository";
import { StoreListRepository } from "../../../stores/repositories/store-list.repository";
import { scopeClientId, type AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { searchFragment } from "../../../../shared/search/search-fragment";
import type { EnvironmentOptions } from "./list-environment-options.interface";

export type { EnvironmentOptions } from "./list-environment-options.interface";
export { searchFragment } from "../../../../shared/search/search-fragment";

export function parseOptionsLimit(value?: string): number {
  const size = Number(value ?? "20");
  if (!Number.isInteger(size) || size <= 0) {
    return 20;
  }
  return Math.min(size, 50);
}

@Injectable()
export class ListEnvironmentOptionsService {
  private readonly stores = new StoreListRepository();
  private readonly environments = new EnvironmentListRepository();

  async execute(
    scope: AccessScope,
    query: { storeId?: string; q?: string; storeQ?: string; limit?: string; selectedName?: string } = {},
  ): Promise<EnvironmentOptions> {
    const clientId = scopeClientId(scope);
    if (!clientId) {
      return { stores: [], environmentNames: [], code: "CLIENT_FOCUS_REQUIRED" };
    }
    const allowedStoreIds = scope.profile === "store_manager" ? scope.allowedStoreIds : null;
    const limit = parseOptionsLimit(query.limit);
    const [stores, environmentNames] = await Promise.all([
      this.stores.listNames({
        clientId,
        allowedStoreIds,
        query: searchFragment(query.storeQ),
        selectedId: query.storeId || undefined,
        limit,
      }),
      this.environments.distinctNames({
        clientId,
        storeId: query.storeId || undefined,
        allowedStoreIds,
        query: searchFragment(query.q),
        selectedName: query.selectedName || undefined,
        limit,
      }),
    ]);
    return { stores, environmentNames };
  }
}
