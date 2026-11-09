describe("dashboard page", () => {
  const web = process.env.WEB_BASE_URL ?? "";
  const api = process.env.API_BASE_URL ?? "";
  const live = web && api ? it : it.skip;

  live("renders the home summary instead of the store list", async () => {
    const token = await login(api);
    const response = await fetch(`${web}/`, {
      headers: { cookie: `accessToken=${token}` },
      redirect: "follow",
    });
    const html = await response.text();
    expect(html).toContain("Painel");
    expect(html).toContain("Lojas");
    expect(html).toContain("Ambientes");
    expect(html).toContain("Atenção");
    expect(html).toContain("Ver todas as lojas");
    expect(html).toContain("Loja Tijuca");
    expect(html).not.toContain("Lojas fora da faixa aparecem primeiro.");
    expect(html).not.toContain("Application error");
  });
});

async function login(api: string): Promise<string> {
  const response = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "carlos.mendes@modacarioca.example", password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
