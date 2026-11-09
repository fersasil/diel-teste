import type { Profile } from "../../../../shared/models/cadastro";

export interface SessionIdentity {
  profile: Profile;
  clientId: string | null;
  clientName: string | null;
}

export interface SessionView extends SessionIdentity {
  asOf: string | null;
}
