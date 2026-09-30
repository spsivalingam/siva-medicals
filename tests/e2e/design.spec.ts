import { expect, test } from "@playwright/test";
import { t } from "../../src/i18n/utils";
import { badgeText, openInstant, site } from "./site-data";

const px = (v: string) => parseFloat(v);

// 1. Bigger shop name + tagline
test.describe("shop name on phones", () => {
  test.use({ viewport: { width: 375, height: 760 } });
  test("is 20px, smaller than the headline", async ({ page }) => {
    await page.goto("/");
    const name = px(await page.getByTestId("brand-name").evaluate((el) => getComputedStyle(el).fontSize));
    const h1 = px(await page.locator("h1").evaluate((el) => getComputedStyle(el).fontSize));
    expect(name).toBe(20);
    expect(name).toBeLessThan(h1);
  });
});

test.describe("shop name on desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test("is 24px", async ({ page }) => {
    await page.goto("/");
    expect(px(await page.getByTestId("brand-name").evaluate((el) => getComputedStyle(el).fontSize))).toBe(24);
  });
});

for (const path of ["/", "/ta/"]) {
  test(`header tagline says what the shop is, where, and since when on ${path}`, async ({ page }) => {
    await page.goto(path);
    const locale = path === "/" ? "en" : "ta";
    const tagline = page.getByTestId("brand-tagline");
    await expect(tagline).toContainText(site.address.area[locale]);
    await expect(tagline).toContainText(String(site.since));
  });
}

// 2. Open/closed status in the first screen
test.describe("hero status on phones", () => {
  test.use({ viewport: { width: 375, height: 760 } });
  test("shows open-now status in the first screen", async ({ page }) => {
    const when = openInstant();
    test.skip(!when, "shop never opens");
    await page.clock.setFixedTime(when!);
    await page.goto("/");
    const badge = page.getByTestId("hero-open-badge");
    await expect(badge).toHaveText(badgeText(when!, "en"));
    const box = (await badge.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(760);
  });
});

test.describe("hero status without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("is hidden rather than empty", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-open-badge")).toBeHidden();
  });
});

// 5. Pharmacy-green cross, distinct from brand teal and WhatsApp green
test("header cross is pharmacy green, distinct from the brand and WhatsApp colours", async ({ page }) => {
  await page.goto("/");
  const cross = await page.getByTestId("brand-cross").evaluate((el) => getComputedStyle(el).fill);
  const brand = await page.getByTestId("cta-call").evaluate((el) => getComputedStyle(el).backgroundColor);
  const wa = await page.getByTestId("cta-whatsapp").evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(cross).not.toBe(brand);
  expect(cross).not.toBe(wa);
});

// 6. Section order: open? where? before why-us
test("sections run services, hours, location, why-us, contact", async ({ page }) => {
  await page.goto("/");
  const order = await page.locator("main > section, main > div > section").evaluateAll((els) =>
    els.map((el) => el.id || el.getAttribute("aria-labelledby")).filter(Boolean),
  );
  expect(order).toEqual(["services", "hours", "location", "why-title", "contact"]);
});

// 7. Bottom bar clears the iPhone home indicator
test("viewport covers the notch area and the bottom bar pads for the home indicator", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
  const usesInset = await page.evaluate(() =>
    [...document.styleSheets].some((ss) => [...ss.cssRules].some((r) => r.cssText.includes("safe-area-inset-bottom"))),
  );
  expect(usesInset).toBe(true);
});

test.describe("header height on phones", () => {
  test.use({ viewport: { width: 360, height: 760 } });
  for (const path of ["/", "/ta/"]) {
    test(`stays within 64px on ${path}`, async ({ page }) => {
      await page.goto(path);
      expect((await page.locator("header").boundingBox())!.height).toBeLessThanOrEqual(64);
    });
  }
});
