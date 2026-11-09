import { isValidAccount } from "./account-rules.service";

describe("account rules", () => {
  it("requires clientId for managers and an empty client for the operator", () => {
    expect(isValidAccount({
      profile: "network_manager",
      clientId: "client-a",
      allowedStoreIds: [],
    })).toBe(true);
    expect(isValidAccount({
      profile: "network_manager",
      clientId: null,
      allowedStoreIds: [],
    })).toBe(false);
    expect(isValidAccount({
      profile: "store_manager",
      clientId: "client-a",
      allowedStoreIds: ["store-a1"],
    })).toBe(true);
    expect(isValidAccount({
      profile: "store_manager",
      clientId: "client-a",
      allowedStoreIds: [],
    })).toBe(false);
    expect(isValidAccount({
      profile: "diel_operator",
      clientId: null,
      allowedStoreIds: [],
    })).toBe(true);
    expect(isValidAccount({
      profile: "diel_operator",
      clientId: "client-a",
      allowedStoreIds: [],
    })).toBe(false);
  });
});
