import { serverApiBase } from "../shared/api-base";
import { kindFromStatus, type LoadKind } from "../shared/load-state";

export interface SessionBody {
  profile: "diel_operator" | "network_manager" | "store_manager";
  clientId: string | null;
  clientName: string | null;
  asOf: string | null;
}

export async function loadSession(token: string): Promise<SessionBody | LoadKind> {
  if (!token) {
    return "session";
  }
  try {
    const response = await fetch(`${serverApiBase()}/api/v1/auth/session`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as SessionBody & { code?: string };
    const kind = kindFromStatus(response.status, body.code);
    if (kind !== "ok") {
      return kind;
    }
    return body;
  } catch {
    return "failure";
  }
}
