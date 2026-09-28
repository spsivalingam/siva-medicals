import { expect, test } from "@playwright/test";
import { closedInstant, justBeforeClosing, openInstant, phoneDigits, whatsappDigits } from "./site-data";

test.describe("contact CTAs", () => {
  for (const path of ["/", "/ta/"]) {
    test(`CTAs are correct on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("cta-call")).toHaveAttribute("href", `tel:+${phoneDigits}`);
      await expect(page.getByTestId("cta-whatsapp")).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${whatsappDigits}\\?text=`));
      await expect(page.getByTestId("cta-directions")).toHaveAttribute(
        "href",
        /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
      );
      await expect(page.getByTestId("cta-prescription")).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${whatsappDigits}\\?text=`));
      const box = await page.getByTestId("cta-call").boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  }
});

test("Tamil WhatsApp message is Tamil", async ({ page }) => {
  await page.goto("/ta/");
  const href = await page.getByTestId("cta-whatsapp").getAttribute("href");
  expect(decodeURIComponent(href!.split("?text=")[1])).toMatch(/[஀-௿]/);
});

test("hours table lists all 7 days", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("hours-table").locator("tbody tr")).toHaveCount(7);
});

test("badge says open during opening hours", async ({ page }) => {
  const when = openInstant();
  test.skip(!when, "shop never opens");
  await page.clock.setFixedTime(when!);
  await page.goto("/");
  const badge = page.getByTestId("open-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-state", "open");
});

test("badge says closed outside opening hours (Tamil)", async ({ page }) => {
  const when = closedInstant();
  test.skip(!when, "shop is open around the clock");
  await page.clock.setFixedTime(when!);
  await page.goto("/ta/");
  await expect(page.getByTestId("open-badge")).toHaveAttribute("data-state", "closed");
  await expect(page.getByTestId("open-badge")).toContainText("மூடப்பட்டுள்ளது");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("hours table visible and badge hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hours-table")).toBeVisible();
    await expect(page.getByTestId("open-badge")).toBeHidden();
  });
});

test.describe("narrow phone", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const path of ["/", "/ta/"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("footer shows licence and pharmacist details", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer).toContainText("Form 20");
  await expect(footer).toContainText("Form 21");
  await expect(footer).toContainText("GSTIN");
  await expect(footer).toContainText("Registered pharmacist");
});

for (const id of ["services", "hours", "contact"]) {
  test(`sticky header does not cover #${id} heading after anchor jump`, async ({ page }) => {
    await page.goto(`/#${id}`);
    await page.evaluate((i) => {
      document.documentElement.style.scrollBehavior = "auto";
      document.getElementById(i)!.scrollIntoView();
    }, id);
    const header = await page.locator("header").boundingBox();
    const heading = await page.locator(`#${id} h2`).boundingBox();
    expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  });
}

test("badge flips to closed when the page stays open past closing time", async ({ page }) => {
  const when = justBeforeClosing();
  test.skip(!when, "shop never closes");
  await page.clock.install({ time: when! });
  await page.goto("/");
  await expect(page.getByTestId("open-badge")).toHaveAttribute("data-state", "open");
  await page.clock.runFor(6 * 60_000);
  await expect(page.getByTestId("open-badge")).toHaveAttribute("data-state", "closed");
});
