import type { Profile } from "../../../../shared/models/cadastro";

export interface AccountShape {
  profile: Profile;
  clientId: string | null;
  allowedStoreIds: string[];
}
