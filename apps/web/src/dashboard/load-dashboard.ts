import { serverApiBase } from "../shared/api-base";
import type { DashboardSummary } from "./dashboard-summary";
import { kindFromStatus } from "../shared/load-state";

export async function loadDashboard(
  token: string,
): Promise<DashboardSummary | "session" | "failure" | "focus"> {
  try {
    const response = await fetch(`${serverApiBase()}/api/v1/stores/summary?alertLimit=10`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as DashboardSummary & { code?: string };
    const kind = kindFromStatus(response.status, body.code);
    if (kind === "ok") {
      return {
        storeCount: body.storeCount ?? 0,
        environmentCount: body.environmentCount ?? 0,
        inRange: body.inRange ?? 0,
        above: body.above ?? 0,
        below: body.below ?? 0,
        noData: body.noData ?? 0,
        online: body.online ?? 0,
        offline: body.offline ?? 0,
        alertCount: body.alertCount ?? 0,
        alertStores: body.alertStores ?? [],
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
