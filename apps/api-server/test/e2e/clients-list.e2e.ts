describe("GET /api/v1/clients", () => {
  const base = process.env.API_BASE_URL ?? "";
  const live = base ? it : it.skip;

  live("lists clients only for the operator, with a page cap", async () => {
    const manager = await loginClientCaller("carlos.mendes@modacarioca.example");
    const forbidden = await fetch(`${base}/api/v1/clients`, {
      headers: { authorization: `Bearer ${manager}` },
    });
    expect(forbidden.status).toBe(403);

    const token = await loginClientCaller("ana.ribeiro@diel.example");
    const first = await fetch(`${base}/api/v1/clients?page=1&pageSize=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.status).toBe(200);
    const page = (await first.json()) as {
      page: number;
      pageSize: number;
      total: number;
      items: Array<{ id: string; name: string }>;
    };
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThan(1);

    const search = await fetch(`${base}/api/v1/clients?q=Moda`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const found = (await search.json()) as { items: Array<{ name: string }> };
    expect(found.items.length).toBeGreaterThan(0);
    expect(found.items.every((item) => item.name.toLowerCase().includes("moda"))).toBe(true);
  });
});

async function loginClientCaller(email: string): Promise<string> {
  const response = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
