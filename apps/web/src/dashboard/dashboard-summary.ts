export interface DashboardAlertStore {
  id: string;
  name: string;
  inRangeCount: number;
  aboveCount: number;
  belowCount: number;
  noDataCount: number;
  onlineCount: number;
  offlineCount: number;
}

export interface DashboardSummary {
  storeCount: number;
  environmentCount: number;
  inRange: number;
  above: number;
  below: number;
  noData: number;
  online: number;
  offline: number;
  alertCount: number;
  alertStores: DashboardAlertStore[];
}

export function environmentCountOf(store: DashboardAlertStore): number {
  return store.inRangeCount + store.aboveCount + store.belowCount + store.noDataCount;
}
