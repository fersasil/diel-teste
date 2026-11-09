import type { Profile } from "../../../../shared/models/cadastro";

export interface SessionView {
  profile: Profile;
  clientId: string | null;
  clientName: string | null;
}
