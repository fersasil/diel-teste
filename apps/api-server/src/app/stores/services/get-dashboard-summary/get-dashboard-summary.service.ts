import { Injectable } from "@nestjs/common";
import { StoreDashboardRepository } from "../../repositories/store-dashboard.repository";
import { scopeClientId, type AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import type { DashboardSummary } from "./get-dashboard-summary.interface";

export function parseAlertLimit(value?: string): number {
  const size = Number(value ?? "10");

  if (!Number.isInteger(size) || size <= 0) {
    return 10;
  }

  return Math.min(size, 20);
}

@Injectable()
export class GetDashboardSummaryService {
  private readonly stores = new StoreDashboardRepository();

  async execute(scope: AccessScope, query: { alertLimit?: string } = {}, virtualNow = new Date()): Promise<DashboardSummary> {
    const clientId = scopeClientId(scope);

    if (!clientId) {
      return {
        storeCount: 0,
        environmentCount: 0,
        inRange: 0,
        above: 0,
        below: 0,
        noData: 0,
        online: 0,
        offline: 0,
        alertCount: 0,
        alertStores: [],
        code: "CLIENT_FOCUS_REQUIRED" as const,
      };
    }

    const allowedStoreIds = scope.profile === "store_manager" ? scope.allowedStoreIds : null;
    const [totals, alertStores] = await Promise.all([
      this.stores.totals({ clientId, allowedStoreIds, virtualNow }),
      this.stores.alerts({ clientId, allowedStoreIds, virtualNow, limit: parseAlertLimit(query.alertLimit) }),
    ]);
    return { ...totals, alertStores };
  }
}
