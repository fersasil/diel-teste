describe("failure pages", () => {
  const web = process.env.WEB_BASE_URL ?? "";
  const api = process.env.API_BASE_URL ?? "";
  const live = web && api ? it : it.skip;

  live("sends a missing session back to the login sentence", async () => {
    const response = await fetch(`${web}/rede`);
    const html = await response.text();
    expect(html).toContain("Sessão encerrada. Entre de novo.");
    expect(html).not.toContain("Application error");
  });

  live("shows a missing environment and a way back", async () => {
    const token = await login(api);
    const response = await fetch(`${web}/ambientes/DOES-NOT-EXIST`, {
      headers: { cookie: `accessToken=${token}` },
    });
    const html = await response.text();
    expect(html).toContain("Ambiente não encontrado.");
    expect(html).toContain('href="/rede"');
    expect(html).not.toContain("Application error");
  });

  live("shows the load sentence instead of an application error", async () => {
    const token = await login(api);
    const response = await fetch(`${web}/ambientes/AMB-001?bucket=2h`, {
      headers: { cookie: `accessToken=${token}` },
    });
    const html = await response.text();
    expect(html).toContain("Não foi possível carregar. Tente de novo.");
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
