import { createClient } from "redis";

describe("GET /api/v1/auth/session", () => {
  const base = process.env.API_BASE_URL;
  const live = base ? it : it.skip;

  live("returns the signed-in profile and hides the operator until focus", async () => {
    const missing = await fetch(`${base}/api/v1/auth/session`);
    expect(missing.status).toBe(401);
    expect(await missing.json()).toEqual({ code: "UNAUTHENTICATED" });

    const carlos = await login("carlos.mendes@modacarioca.example");
    const manager = await fetch(`${base}/api/v1/auth/session`, {
      headers: { authorization: `Bearer ${carlos.accessToken}` },
    });
    expect(manager.status).toBe(200);
    const managerBody = (await manager.json()) as { profile: string; clientId: string; clientName: string };
    expect(managerBody.profile).toBe("network_manager");
    expect(managerBody.clientId).toBe("CLI-001");
    expect(managerBody.clientName).toBe("Moda Carioca");
    expect(managerBody).not.toHaveProperty("email");
    expect(managerBody).not.toHaveProperty("accessToken");

    if (process.env.REDIS_URL) {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.del("operator:focus:USR-001");
      await redis.disconnect();
    }
    const ana = await login("ana.ribeiro@diel.example");
    const operator = await fetch(`${base}/api/v1/auth/session`, {
      headers: { authorization: `Bearer ${ana.accessToken}` },
    });
    expect(operator.status).toBe(200);
    expect(await operator.json()).toEqual({
      profile: "diel_operator",
      clientId: null,
      clientName: null,
    });
  });
});

async function login(email: string): Promise<{ accessToken: string }> {
  const response = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "change-me" }),
  });
  return response.json() as Promise<{ accessToken: string }>;
}
