import type { AccessScope } from "./access-scope.interface";

export type { AccessScope } from "./access-scope.interface";

export function scopeClientId(scope: AccessScope): string | null {
  if (scope.profile === "diel_operator") {
    return scope.focusedClientId;
  }
  return scope.clientId;
}
