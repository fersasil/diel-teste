import { hashPassword, passwordMatches } from "../../src/app/auth/services/login/login.service";
import { isValidAccount } from "../../src/app/auth/services/account-rules/account-rules.service";
import { scopeClientId } from "../../src/app/auth/services/access-scope/access-scope.service";

describe("auth", () => {
  it("rejects a bad password and keeps each persona inside its client", () => {
    const stored = hashPassword("change-me");
    expect(passwordMatches("change-me", stored)).toBe(true);
    expect(passwordMatches("wrong", stored)).toBe(false);
    expect(passwordMatches("change-me", "change-me")).toBe(false);
    expect(isValidAccount({
      profile: "network_manager",
      clientId: "client-a",
      allowedStoreIds: [],
    })).toBe(true);
    expect(scopeClientId({
      profile: "diel_operator",
      clientId: null,
      allowedStoreIds: [],
      focusedClientId: null,
    })).toBeNull();
    expect(scopeClientId({
      profile: "network_manager",
      clientId: "client-a",
      allowedStoreIds: [],
      focusedClientId: "client-b",
    })).toBe("client-a");
  });
});
