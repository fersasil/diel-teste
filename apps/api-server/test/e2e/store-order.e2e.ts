describe("store list order", () => {
  const base = process.env.API_BASE_URL;
  const live = base ? it : it.skip;

  live("puts stores above or below the band before the others", async () => {
    const login = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "carlos.mendes@modacarioca.example", password: "change-me" }),
    });
    const token = ((await login.json()) as { accessToken: string }).accessToken;
    const response = await fetch(`${base}/api/v1/stores`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      items: Array<{ name: string; outOfRangeEnvCount: number }>;
    };
    const outOfRange = (item: { outOfRangeEnvCount: number }) => item.outOfRangeEnvCount > 0;
    const firstInRange = body.items.findIndex((item) => !outOfRange(item));
    if (body.items.some(outOfRange)) {
      expect(outOfRange(body.items[0])).toBe(true);
    }
    if (firstInRange > 0) {
      expect(body.items.slice(0, firstInRange).every(outOfRange)).toBe(true);
      expect(body.items.slice(firstInRange).some(outOfRange)).toBe(false);
    }
    const names = body.items.map((item) => item.name);
    const exceptionNames = body.items.filter(outOfRange).map((item) => item.name);
    expect([...exceptionNames].sort((a, b) => a.localeCompare(b))).toEqual(exceptionNames);
    expect(names).toEqual(expect.arrayContaining(exceptionNames));
  });
});
