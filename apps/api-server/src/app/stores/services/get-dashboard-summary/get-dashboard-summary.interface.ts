import type { DashboardAlertStore, DashboardTotals } from "../../repositories/store-dashboard.repository";

export interface DashboardSummary extends DashboardTotals {
  alertStores: DashboardAlertStore[];
  code?: "CLIENT_FOCUS_REQUIRED";
}
