export interface EnvironmentUpdated {
  type: "environment.updated";
  environmentId: string;
  storeId: string;
  lastTemp: number | null;
  lastComfortStatus: string | null;
  deviceStatus: "ONLINE" | "OFFLINE" | "NO_DATA";
  isCurrentlyOperating: boolean;
  virtualNow: string;
}

export function environmentUpdated(input: Omit<EnvironmentUpdated, "type">): EnvironmentUpdated {
  return { type: "environment.updated", ...input };
}
