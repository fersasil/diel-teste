import { parsePage } from "../../src/app/stores/services/list-stores/list-stores.service";
import { signToken } from "../support/sign-token";

describe("GET /api/v1/stores", () => {
  it("defaults page to 1 and pageSize to 50, and caps pageSize at 100", () => {
    expect(parsePage({})).toEqual({ page: 1, pageSize: 50 });
    expect(parsePage({ pageSize: "500" })).toEqual({ page: 1, pageSize: 100 });
  });

  const base = process.env.API_BASE_URL;
  const live = base ? it : it.skip;

  live("lists only the caller client", async () => {
    process.env.JWT_SECRET ??= "change-me";
    const token = signToken({
      profile: "network_manager",
      clientId: "CLI-001",
      allowedStoreIds: [],
      focusedClientId: null,
    });
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const probe = await fetch(`${base}/api/v1/stores`);

        if (probe.status > 0) {
          break;
        }

      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const started = Date.now();
    const response = await fetch(`${base}/api/v1/stores`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const elapsed = Date.now() - started;
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      page: number;
      pageSize: number;
      items: Array<{ id: string; aboveCount: number }>;
    };
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(50);
    expect(body.items.map((item) => item.id)).not.toContain("LOJA-MG-001");
    expect(body.items.map((item) => item.id)).toContain("LOJA-RJ-001");
    expect(body.items[0]).toHaveProperty("comfortPercent");
    expect(body.items[0]).toHaveProperty("outOfRangeEnvCount");
    expect(elapsed).toBeLessThan(1000);

    const search = await fetch(`${base}/api/v1/stores?q=Paul`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const found = (await search.json()) as { items: Array<{ name: string }> };
    expect(found.items.length).toBeGreaterThan(0);
    expect(found.items.every((item) => item.name.toLowerCase().includes("paul"))).toBe(true);

    const summary = await fetch(`${base}/api/v1/stores/summary?alertLimit=10`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const board = (await summary.json()) as {
      storeCount: number;
      environmentCount: number;
      alertStores: Array<{ name: string }>;
    };
    expect(board.storeCount).toBeGreaterThan(0);
    expect(board.environmentCount).toBeGreaterThan(0);
    expect(board.alertStores.length).toBeLessThanOrEqual(10);
    expect(board.alertStores.map((store) => store.name)).toContain("Loja Tijuca");
  });
});
