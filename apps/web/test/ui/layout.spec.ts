import { expect, test } from "@playwright/test";

const api = process.env.API_BASE_URL ?? "http://localhost:3000";

test("entry, network and detail fit the viewport and take keyboard focus", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).focus();
  const outline = await page.getByRole("button", { name: "Entrar" }).evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");
  await expectFits(page);

  const login = await request.post(`${api}/api/v1/auth/login`, {
    data: { email: "carlos.mendes@modacarioca.example", password: "change-me" },
  });
  const body = (await login.json()) as { accessToken: string };
  const web = process.env.WEB_BASE_URL ?? "http://localhost:3001";
  await page.context().addCookies([{ name: "accessToken", value: body.accessToken, url: web }]);

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await page.goto("/rede");
    await expect(page.getByRole("heading", { name: "Visão da rede" })).toBeVisible();
    const wrap = await page.locator(".store-card h2").first().evaluate((element) => getComputedStyle(element).overflowWrap);
    expect(wrap).toBe("anywhere");
    await page.getByRole("button", { name: "Sair" }).focus();
    const storeLink = page.locator("a[href^='/ambientes/']").first();
    await storeLink.focus();
    await storeLink.click();
    await expect(page.locator(".buckets a[aria-current='page']")).toHaveText("30 minutos");
    await page.getByRole("link", { name: "1 hora" }).focus();
    await expectFits(page);
  }
});

async function expectFits(page: import("@playwright/test").Page): Promise<void> {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(fits).toBe(true);
}
