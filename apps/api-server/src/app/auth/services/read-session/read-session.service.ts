import { Injectable } from "@nestjs/common";
import type { Profile } from "../../../../shared/models/cadastro";
import { scopeClientId, type AccessScope } from "../access-scope/access-scope.service";
import { ClientRepository } from "../../../clients/repositories/client.repository";
import type { SessionView } from "./read-session.interface";

export type { SessionView } from "./read-session.interface";

export function assembleSession(
  profile: Profile,
  clientId: string | null,
  clientName: string | null,
): SessionView {
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
    if (!clientId) {
      return assembleSession(scope.profile, null, null);
    }
    const client = await this.clients.findById(clientId);
    return assembleSession(scope.profile, clientId, client?.name ?? null);
  }
}
