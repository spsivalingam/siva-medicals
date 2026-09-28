import { expect, test } from "@playwright/test";

test("unknown route shows bilingual 404 with home links", async ({ page }) => {
  const res = await page.goto("/ta/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("Page not found");
  await expect(page.getByRole("link", { name: "Go to home page" })).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

test("robots.txt points to sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  expect(await res.text()).toMatch(/Sitemap: https?:\/\/.+\/sitemap-index\.xml/);
});

test("sitemap lists both locales", async ({ request }) => {
  const res = await request.get("/sitemap-0.xml");
  const xml = await res.text();
  expect(xml).toContain("/ta/");
  expect(xml).toContain('hreflang="ta-IN"');
});

test("favicon and og image are served", async ({ request }) => {
  expect((await request.get("/favicon.svg")).ok()).toBe(true);
  const og = await request.get("/og-image.png");
  expect(og.ok()).toBe(true);
  expect(og.headers()["content-type"]).toContain("image/png");
});
