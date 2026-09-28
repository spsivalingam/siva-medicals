import { expect, test } from "@playwright/test";

const ratio = (el: Element) => {
  const c = getComputedStyle(el);
  return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
};

test("Tamil body text uses roomy line-height", async ({ page }) => {
  await page.goto("/ta/");
  expect(await page.locator("h1 + p").evaluate(ratio)).toBeGreaterThanOrEqual(1.7);
  expect(await page.locator("#services li p").first().evaluate(ratio)).toBeGreaterThanOrEqual(1.7);
});

test("Tamil headings have room for stacked vowel signs", async ({ page }) => {
  await page.goto("/ta/");
  expect(await page.locator("h1").evaluate(ratio)).toBeGreaterThanOrEqual(1.35);
  const h1 = await page.locator("h1").evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(h1).toBeLessThanOrEqual(0);
});

test("English line-height is unchanged", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("h1").evaluate(ratio)).toBeLessThan(1.3);
});

for (const path of ["/", "/ta/"]) {
  test(`no visible text smaller than 16px on ${path} (except fine print)`, async ({ page }) => {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .filter((el) => !el.closest("[data-fine-print], .sr-only, astro-dev-toolbar"))
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent!.trim().slice(0, 30)}`),
    );
    expect(small).toEqual([]);
  });

  test(`only loaded font weights (400/700) are used on ${path}`, async ({ page }) => {
    await page.goto(path);
    const odd = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll("body *")].map((el) => getComputedStyle(el).fontWeight))].filter(
        (w) => w !== "400" && w !== "700",
      ),
    );
    expect(odd).toEqual([]);
  });
}
