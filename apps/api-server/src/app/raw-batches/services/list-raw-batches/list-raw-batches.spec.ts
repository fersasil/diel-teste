import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { decideRawBatchAccess } from "./list-raw-batches.rules";

function scope(partial: Partial<AccessScope> & Pick<AccessScope, "profile">): AccessScope {
  return {
    clientId: null,
    allowedStoreIds: [],
    focusedClientId: null,
    ...partial,
  };
}

describe("raw batch access", () => {
  it("allows the network manager and the focused operator only", () => {
    expect(decideRawBatchAccess(scope({
      profile: "network_manager",
      clientId: "client-a",
    }))).toBe("OK");
    expect(decideRawBatchAccess(scope({
      profile: "store_manager",
      clientId: "client-a",
      allowedStoreIds: ["store-a1"],
    }))).toBe("FORBIDDEN");
    expect(decideRawBatchAccess(scope({ profile: "diel_operator" }))).toBe(
      "CLIENT_FOCUS_REQUIRED",
    );
    expect(decideRawBatchAccess(scope({
      profile: "diel_operator",
      focusedClientId: "client-a",
    }))).toBe("OK");
  });
});
