import type { EnvironmentRow } from "../../repositories/environment.repository";
import { summarize, summarizeScoped } from "./get-environment-summary.service";

const environment: EnvironmentRow = {
  id: "AMB-001",
  name: "Salão",
  clientId: "CLI-001",
  storeId: "LOJA-RJ-001",
  comfortMin: 21,
  comfortMax: 25,
  lastTemp: 22,
  lastComfortStatus: "IN_RANGE",
  lastSeenAt: new Date("2026-04-02T15:00:00.000Z"),
  isCurrentlyOperating: true,
  storeName: "Loja Tijuca",
  timezone: "America/Sao_Paulo",
};

describe("environment summary", () => {
  it("copies the store name and the store timezone", () => {
    const summary = summarize(environment, new Date("2026-04-02T15:00:00.000Z"), 1, 1);
    expect(summary.storeName).toBe("Loja Tijuca");
    expect(summary.timezone).toBe("America/Sao_Paulo");
  });

  it("returns NOT_FOUND when the row is missing, including another client", () => {
    expect(summarizeScoped(null, new Date(), 0, 0)).toEqual({ code: "NOT_FOUND" });
  });
});
