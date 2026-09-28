import { expect, test } from "@playwright/test";

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

test("badge shows closing time and a status dot while open", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-28T05:00:00Z")); // Mon 10:30 IST
  await page.goto("/");
  const badge = page.getByTestId("open-badge");
  await expect(badge).toHaveText("Open now · closes 10:30 pm");
  const dot = await badge.evaluate((el) => getComputedStyle(el, "::before").width);
  expect(dot).toBe("10px");
});

test("Tamil badge puts the time first", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-28T05:00:00Z"));
  await page.goto("/ta/");
  await expect(page.getByTestId("open-badge")).toHaveText("திறந்துள்ளது · இரவு 10:30 வரை");
});

test("closed badge shows next opening time", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-27T10:00:00Z")); // Sun 15:30 IST
  await page.goto("/");
  await expect(page.getByTestId("open-badge")).toHaveText("Closed now · opens 8:00 am");
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 375, height: 760 } });

  test("bottom action bar offers call, WhatsApp and directions", async ({ page }) => {
    await page.goto("/ta/");
    const bar = page.getByTestId("action-bar");
    await expect(bar).toBeVisible();
    const links = bar.locator("a");
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute("href", "tel:+919876543210");
    await expect(links.nth(1)).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210/);
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
