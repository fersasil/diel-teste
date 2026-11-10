import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { decideIntakeAccess } from "./get-intake.rules";

function scope(partial: Partial<AccessScope> & Pick<AccessScope, "profile">): AccessScope {
  return {
    clientId: null,
    allowedStoreIds: [],
    focusedClientId: null,
    ...partial,
  };
}

describe("intake access", () => {
  it("lets the Diel operator in without a focused client", () => {
    expect(decideIntakeAccess(scope({ profile: "diel_operator" }))).toBe("OK");
  });

  it("keeps the client managers out", () => {
    expect(decideIntakeAccess(scope({ profile: "network_manager", clientId: "CLI-001" }))).toBe("FORBIDDEN");
    expect(decideIntakeAccess(scope({ profile: "store_manager", clientId: "CLI-001", allowedStoreIds: ["LOJA-RJ-001"] }))).toBe("FORBIDDEN");
  });
});
