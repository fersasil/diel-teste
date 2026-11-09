export interface EnvironmentLink {
  id: string;
  name: string;
  comfortStatus?: "IN_RANGE" | "ABOVE" | "BELOW" | "NO_DATA" | null;
  deviceStatus?: "ONLINE" | "OFFLINE" | "NO_DATA";
}

export interface StoreCardData {
  id: string;
  name: string;
  city?: string;
  inRangeCount: number;
  aboveCount: number;
  belowCount: number;
  noDataCount: number;
  onlineCount: number;
  offlineCount: number;
  comfortPercent?: number | null;
  outOfRangeEnvCount?: number;
  environments?: EnvironmentLink[];
}
