import { expect, test } from "@playwright/test";
import { badgeText, closedInstant, openInstant, phoneDigits, whatsappDigits } from "./site-data";

const filled = (el: Element) => {
  const bg = getComputedStyle(el).backgroundColor;
  return bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)";
};

test("hero has exactly one filled primary button (Call)", async ({ page }) => {
  await page.goto("/");
  expect(await page.getByTestId("cta-call").evaluate(filled)).toBe(true);
  expect(await page.getByTestId("cta-whatsapp").evaluate(filled)).toBe(false);
  expect(await page.getByTestId("cta-directions").evaluate(filled)).toBe(false);
});

test("badge shows next change time and a status dot while open", async ({ page }) => {
  const when = openInstant();
  test.skip(!when, "shop never opens");
  await page.clock.setFixedTime(when!);
  await page.goto("/");
  const badge = page.getByTestId("open-badge");
  await expect(badge).toHaveText(badgeText(when!, "en"));
  const dot = await badge.evaluate((el) => getComputedStyle(el, "::before").width);
  expect(dot).toBe("10px");
});

test("Tamil badge puts the time first", async ({ page }) => {
  const when = openInstant();
  test.skip(!when, "shop never opens");
  await page.clock.setFixedTime(when!);
  await page.goto("/ta/");
  const text = badgeText(when!, "ta");
  await expect(page.getByTestId("open-badge")).toHaveText(text);
  if (text.includes("·")) expect(text).toMatch(/வரை$/);
});

test("closed badge shows next opening time", async ({ page }) => {
  const when = closedInstant();
  test.skip(!when, "shop is open around the clock");
  await page.clock.setFixedTime(when!);
  await page.goto("/");
  await expect(page.getByTestId("open-badge")).toHaveText(badgeText(when!, "en"));
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 375, height: 760 } });

  test("bottom action bar offers call, WhatsApp and directions", async ({ page }) => {
    await page.goto("/ta/");
    const bar = page.getByTestId("action-bar");
    await expect(bar).toBeVisible();
    const links = bar.locator("a");
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute("href", `tel:+${phoneDigits}`);
    await expect(links.nth(1)).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${whatsappDigits}`));
    await expect(links.nth(2)).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps/);
    for (const i of [0, 1, 2]) expect((await links.nth(i).boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });

  test("bottom bar never covers the end of the footer", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    const bar = (await page.getByTestId("action-bar").boundingBox())!;
    const last = (await page.locator("[data-fine-print]").boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(bar.y);
  });

  test("services are compact rows: icon beside the title", async ({ page }) => {
    await page.goto("/");
    const icon = (await page.locator("#services li span").first().boundingBox())!;
    const title = (await page.locator("#services li h3").first().boundingBox())!;
    expect(title.x).toBeGreaterThan(icon.x + icon.width);
  });
});

test.describe("desktop layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test("no bottom bar on desktop; header call button visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("action-bar")).toBeHidden();
    await expect(page.getByTestId("header-call")).toBeVisible();
  });
});
