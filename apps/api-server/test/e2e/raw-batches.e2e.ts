import { decideRawBatchAccess } from "../../src/app/raw-batches/services/list-raw-batches/list-raw-batches.rules";

describe("raw batches", () => {
  it("hides batches from the store manager and from an unfocused operator", () => {
    expect(decideRawBatchAccess({
      profile: "network_manager",
      clientId: "client-a",
      allowedStoreIds: [],
      focusedClientId: null,
    })).toBe("OK");
    expect(decideRawBatchAccess({
      profile: "store_manager",
      clientId: "client-a",
      allowedStoreIds: ["store-a1"],
      focusedClientId: null,
    })).toBe("FORBIDDEN");
    expect(decideRawBatchAccess({
      profile: "diel_operator",
      clientId: null,
      allowedStoreIds: [],
      focusedClientId: null,
    })).toBe("CLIENT_FOCUS_REQUIRED");
  });
});
