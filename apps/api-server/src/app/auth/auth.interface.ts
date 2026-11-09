import type { Profile } from "../../shared/models/cadastro";

export interface AccessScope {
  profile: Profile;
  clientId: string | null;
  allowedStoreIds: string[];
  focusedClientId: string | null;
  userId?: string;
}
