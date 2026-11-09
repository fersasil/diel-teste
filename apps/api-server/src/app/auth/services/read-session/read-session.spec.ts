import { assembleSession } from "./read-session.service";

describe("assembleSession", () => {
  it("keeps the client name for a network manager and a store manager", () => {
    expect(assembleSession("network_manager", "CLI-001", "Moda Carioca")).toEqual({
      profile: "network_manager",
      clientId: "CLI-001",
      clientName: "Moda Carioca",
    });
    expect(assembleSession("store_manager", "CLI-001", "Moda Carioca").clientName).toBe("Moda Carioca");
  });

  it("drops the client when the operator has no focus", () => {
    expect(assembleSession("diel_operator", null, "Moda Carioca")).toEqual({
      profile: "diel_operator",
      clientId: null,
      clientName: null,
    });
  });

  it("keeps the focused client name and hides secrets", () => {
    const view = assembleSession("diel_operator", "CLI-001", "Moda Carioca");
    expect(view).toEqual({
      profile: "diel_operator",
      clientId: "CLI-001",
      clientName: "Moda Carioca",
    });
    expect(view).not.toHaveProperty("email");
    expect(view).not.toHaveProperty("accessToken");
    expect(view).not.toHaveProperty("password");
  });
});
