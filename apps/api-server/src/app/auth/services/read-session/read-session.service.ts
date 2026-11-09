import { Injectable } from "@nestjs/common";
import type { Profile } from "../../../../shared/models/cadastro";
import { scopeClientId, type AccessScope } from "../access-scope/access-scope.service";
import { ClientRepository } from "../../../clients/repositories/client.repository";
import { readStoredVirtualNow } from "../../../../infra/redis/read-virtual-clock";
import type { SessionIdentity, SessionView } from "./read-session.interface";

export type { SessionView } from "./read-session.interface";

export function assembleSession(
  profile: Profile,
  clientId: string | null,
  clientName: string | null,
): SessionIdentity {
  if (!clientId) {
    return { profile, clientId: null, clientName: null };
  }
  return { profile, clientId, clientName };
}

@Injectable()
export class ReadSessionService {
  private readonly clients = new ClientRepository();

  async execute(scope: AccessScope): Promise<SessionView> {
    const clientId = scopeClientId(scope);
    const asOf = await readStoredVirtualNow();
    if (!clientId) {
      return { ...assembleSession(scope.profile, null, null), asOf };
    }
    const client = await this.clients.findById(clientId);
    return { ...assembleSession(scope.profile, clientId, client?.name ?? null), asOf };
  }
}
