export const COMFORT_STATUSES = ["IN_RANGE", "ABOVE", "BELOW"] as const;
export type ComfortStatus = (typeof COMFORT_STATUSES)[number];

export const PROFILES = [
  "network_manager",
  "store_manager",
  "diel_operator",
] as const;
export type Profile = (typeof PROFILES)[number];

export interface Client {
  id: string;
  name: string;
  segment: string;
}

export interface Store {
  id: string;
  clientId: string;
  name: string;
  type: string;
  city: string;
  uf: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface EnvironmentSnapshot {
  id: string;
  storeId: string;
  lastSeenAt: Date | null;
  lastComfortStatus: ComfortStatus | null;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  clientId: string | null;
  allowedStoreIds: string[];
}

export function assertUf(uf: string): void {
  if (uf.length !== 2) {
    throw new Error("uf must be 2 characters");
  }
}

export function assertComfortRange(min: number, max: number): void {
  if (min > max) {
    throw new Error("comfortMin must be <= comfortMax");
  }
}
