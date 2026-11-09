import { createHmac } from "node:crypto";

describe("network page", () => {
  const web = process.env.WEB_BASE_URL ?? "";
  const api = process.env.API_BASE_URL ?? "";
  const live = web && api ? it : it.skip;

  live("renders one block per store and the comfort labels", async () => {
    const token = await login(api, "carlos.mendes@modacarioca.example");
    const html = await readPage(web, "/rede", token);
    const byDevice = await readPage(web, "/rede?sort=device", token);
    expect(html).toContain("Dentro da faixa");
    expect(html).toContain("Acima");
    expect(html).toContain("Qualquer status");
    expect(html).toContain("<option value=\"ONLINE\">Online</option>");
    expect(byDevice).toContain("Offline");
    const offline = await readPage(web, "/rede?deviceStatus=OFFLINE", token);
    expect(offline).toContain("Offline");
    expect(offline).toContain(">Loja Tijuca</h2>");
    expect(html).toContain("Conforto");
    expect(html).toContain("Dispositivo");
    expect(html).toContain("Loja Tijuca");
    expect(html).toContain("/ambientes/");
    expect(html).toContain("Último dia");
    expect(html).toContain("Última semana");
    expect(html).toContain("30 dias");
    expect(html).toContain("Todas as lojas");
    expect(html).toContain("Todos os ambientes");
    expect(html).toContain("Qualquer conforto");
    expect(html).toContain("sort=store");
    expect(html).toMatch(/1<!-- -->[–-]<!-- -->10|1–10/);
    expect(html).not.toContain("Application error");
  });

  live("filters the table by store on the server", async () => {
    const token = await login(api, "carlos.mendes@modacarioca.example");
    const html = await readPage(web, "/rede?storeId=LOJA-SP-001", token);
    expect(html).toContain(">Loja Paulista</h2>");
    expect(html).not.toContain(">Loja Tijuca</h2>");
    expect(html).toContain("/ambientes/");
  });

  live("filters the table by environment and comfort on the server", async () => {
    const token = await login(api, "carlos.mendes@modacarioca.example");
    const byEnv = await readPage(web, `/rede?environmentName=${encodeURIComponent("Estoque")}`, token);
    expect(byEnv).toContain(">Estoque</a>");
    expect(byEnv).not.toContain(">Provadores</a>");
    const byComfort = await readPage(web, "/rede?comfortStatus=ABOVE", token);
    expect(byComfort).toContain("Acima");
    expect(byComfort).not.toContain("Página seguinte");
  });

  live("shows the empty sentence when the client has no stores", async () => {
    const token = sign({
      sub: "USR-NONE",
      profile: "network_manager",
      clientId: "CLI-NONE",
      allowedStoreIds: [],
    });
    const html = await readPage(web, "/rede", token);
    expect(html).toContain("Nenhuma loja neste alcance.");
  });
});

async function login(api: string, email: string): Promise<string> {
  const response = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "change-me" }),
  });
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}

async function readPage(web: string, path: string, token: string): Promise<string> {
  const response = await fetch(`${web}${path}`, {
    headers: { cookie: `accessToken=${token}` },
  });
  return response.text();
}

function sign(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env.JWT_SECRET ?? "change-me")
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}
