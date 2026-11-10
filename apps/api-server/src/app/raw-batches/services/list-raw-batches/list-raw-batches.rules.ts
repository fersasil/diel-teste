import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import type { RawBatchDecision } from "./list-raw-batches.interface";

export type { RawBatchDecision } from "./list-raw-batches.interface";

export function decideRawBatchAccess(scope: AccessScope): RawBatchDecision {
  if (scope.profile === "store_manager") {
    return "FORBIDDEN";
  }

  if (scope.profile === "diel_operator" && !scope.focusedClientId) {
    return "CLIENT_FOCUS_REQUIRED";
  }

  if (scope.profile === "network_manager" || scope.profile === "diel_operator") {
    return "OK";
  }

  return "FORBIDDEN";
}
