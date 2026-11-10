import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import type { IntakeDecision } from "./get-intake.interface";

export function decideIntakeAccess(scope: AccessScope): IntakeDecision {
  if (scope.profile === "diel_operator") {
    return "OK";
  }

  return "FORBIDDEN";
}
