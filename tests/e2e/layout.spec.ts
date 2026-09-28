import { expect, test } from "@playwright/test";

test("English home has correct lang, title and one h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await expect(page).toHaveTitle(/Sri Arogya Pharmacy/);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("language toggle round-trips EN → TA → EN", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("lang-toggle").click();
  await expect(page).toHaveURL(/\/ta\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ta-IN");
  await page.getByTestId("lang-toggle").click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
});

test("hreflang alternates and canonical are present", async ({ page }) => {
  await page.goto("/ta/");
  await expect(page.locator('link[rel="alternate"][hreflang="en-IN"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="ta-IN"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ta\/$/);
});

test("JSON-LD parses as a Pharmacy", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? "{}");
  expect(data["@type"]).toBe("Pharmacy");
  expect(data.telephone).toBe("+919876543210");
});

test("Tamil page loads the Noto Sans Tamil font", async ({ page }) => {
  await page.goto("/ta/");
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((f) => f.family.includes("Noto Sans Tamil") && f.status === "loaded");
  });
  expect(loaded).toBe(true);
});

test("header call button is a tel: link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("header-call")).toHaveAttribute("href", "tel:+919876543210");
});

test("no console errors on either page", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await page.goto("/ta/");
  expect(errors).toEqual([]);
});
