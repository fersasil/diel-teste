describe("focus page", () => {
  const web = process.env.WEB_BASE_URL ?? "";
  const api = process.env.API_BASE_URL ?? "";
  const live = web && api ? it : it.skip;

  live("lists clients in a table for the operator", async () => {
    const token = await login(api);
    const html = await fetch(`${web}/entrar/foco`, {
      headers: { cookie: `accessToken=${token}` },
    }).then((response) => response.text());
    expect(html).toContain("Escolha o cliente");
    expect(html).toContain("Moda Carioca");
    expect(html).toContain("Banco Horizonte");
    expect(html).toContain("Segmento");
    expect(html).toMatch(/1<!-- -->[–-]<!-- -->2|1–2/);
    expect(html).not.toContain("Application error");
  });
});

async function login(api: string): Promise<string> {
  const response = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "ana.ribeiro@diel.example", password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
