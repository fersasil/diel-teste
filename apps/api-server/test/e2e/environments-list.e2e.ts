describe("GET /api/v1/environments", () => {
  const base = process.env.API_BASE_URL ?? "";
  const live = base ? it : it.skip;

  live("paginates environments and filters by store", async () => {
    const token = await login("carlos.mendes@modacarioca.example");
    const first = await fetch(`${base}/api/v1/environments?page=1&pageSize=10`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.status).toBe(200);
    const page = (await first.json()) as {
      page: number;
      pageSize: number;
      total: number;
      items: Array<{ storeId: string; storeName: string; name: string }>;
    };
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(10);
    expect(page.items).toHaveLength(10);
    expect(page.total).toBeGreaterThan(10);
    expect(page.items[0].storeName).toBe("Loja Tijuca");

    const filtered = await fetch(`${base}/api/v1/environments?storeId=LOJA-SP-001`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const onlyPaulista = (await filtered.json()) as { items: Array<{ storeId: string }>; total: number };
    expect(onlyPaulista.total).toBeGreaterThan(0);
    expect(onlyPaulista.items.every((item) => item.storeId === "LOJA-SP-001")).toBe(true);
    expect(onlyPaulista.items.some((item) => item.storeId === "LOJA-RJ-001")).toBe(false);

    const byEnv = await fetch(`${base}/api/v1/environments?environmentName=${encodeURIComponent("Estoque")}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const named = (await byEnv.json()) as { items: Array<{ name: string }>; total: number };
    expect(named.total).toBeGreaterThan(1);
    expect(named.items.every((item) => item.name === "Estoque")).toBe(true);

    const byComfort = await fetch(`${base}/api/v1/environments?comfortStatus=NO_DATA&pageSize=100`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const noData = (await byComfort.json()) as { items: Array<{ comfortStatus: string }> };
    expect(noData.items.every((item) => item.comfortStatus === "NO_DATA")).toBe(true);

    const sorted = await fetch(`${base}/api/v1/environments?sort=store&dir=asc&pageSize=100`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const names = ((await sorted.json()) as { items: Array<{ storeName: string }> }).items.map((item) => item.storeName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  live("returns light filter options without paging the table", async () => {
    const token = await login("carlos.mendes@modacarioca.example");
    const response = await fetch(`${base}/api/v1/environments/options`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      stores: Array<{ id: string; name: string }>;
      environmentNames: string[];
    };
    expect(body.stores.map((store) => store.id)).toEqual(expect.arrayContaining(["LOJA-RJ-001", "LOJA-SP-001"]));
    expect(body.stores.map((store) => store.id)).not.toContain("LOJA-MG-001");
    expect(body.environmentNames).toEqual(expect.arrayContaining(["Estoque", "Provadores"]));
    expect(new Set(body.environmentNames).size).toBe(body.environmentNames.length);

    const limited = await fetch(`${base}/api/v1/environments/options?limit=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const cap = (await limited.json()) as { stores: unknown[]; environmentNames: string[] };
    expect(cap.stores.length).toBeLessThanOrEqual(1);
    expect(cap.environmentNames.length).toBeLessThanOrEqual(1);

    const search = await fetch(`${base}/api/v1/environments/options?q=Esto`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const found = (await search.json()) as { environmentNames: string[] };
    expect(found.environmentNames.length).toBeGreaterThan(0);
    expect(found.environmentNames.every((name) => name.toLowerCase().includes("esto"))).toBe(true);

    const stores = await fetch(`${base}/api/v1/environments/options?storeQ=Paul`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const byStore = (await stores.json()) as { stores: Array<{ name: string }> };
    expect(byStore.stores.length).toBeGreaterThan(0);
    expect(byStore.stores.every((store) => store.name.toLowerCase().includes("paul"))).toBe(true);
  });

  live("hides environments from other clients", async () => {
    const token = await login("carlos.mendes@modacarioca.example");
    const response = await fetch(`${base}/api/v1/environments?pageSize=100`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = (await response.json()) as { items: Array<{ storeId: string }> };
    expect(body.items.map((item) => item.storeId)).not.toContain("LOJA-MG-001");
  });
});

async function login(email: string): Promise<string> {
  const response = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
