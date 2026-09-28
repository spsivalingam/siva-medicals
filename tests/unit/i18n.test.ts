import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { ta } from "../../src/i18n/ta";
import { alternatePath, getLocaleFromUrl, localePath, t } from "../../src/i18n/utils";

const shape = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(shape) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]))
    : typeof v;

describe("dictionaries", () => {
  it("Tamil has exactly the same shape as English", () => {
    expect(shape(ta)).toEqual(shape(en));
  });
  it("Tamil strings are actually Tamil where it matters", () => {
    expect(ta.hero.title).toMatch(/[஀-௿]/);
  });
  it("has 7 day names starting Sunday", () => {
    expect(en.hours.days).toHaveLength(7);
    expect(en.hours.days[0]).toBe("Sunday");
  });
});

describe("utils", () => {
  it("t returns the right dictionary", () => {
    expect(t("ta")).toBe(ta);
    expect(t("en")).toBe(en);
  });
  it("detects locale from URL", () => {
    expect(getLocaleFromUrl(new URL("https://x.in/ta/"))).toBe("ta");
    expect(getLocaleFromUrl(new URL("https://x.in/"))).toBe("en");
    expect(getLocaleFromUrl(new URL("https://x.in/tamil"))).toBe("en");
  });
  it("builds locale paths", () => {
    expect(localePath("en")).toBe("/");
    expect(localePath("ta")).toBe("/ta/");
    expect(localePath("ta", "/about/")).toBe("/ta/about/");
  });
  it("builds alternate paths both ways", () => {
    expect(alternatePath(new URL("https://x.in/"), "ta")).toBe("/ta/");
    expect(alternatePath(new URL("https://x.in/ta/"), "en")).toBe("/");
    expect(alternatePath(new URL("https://x.in/ta"), "en")).toBe("/");
  });
});

describe("copy holds no business details", () => {
  const all = (d: unknown): string[] =>
    typeof d === "string" ? [d] : d && typeof d === "object" ? Object.values(d).flatMap(all) : [];
  it("no clock times in UI copy (hours live in site.ts)", () => {
    for (const s of [...all(en), ...all(ta)]) expect(s).not.toMatch(/\d{1,2}[:.]\d{2}/);
  });
  it("delivery copy says prescription medicines need a verified prescription", () => {
    const delivery = en.services.items.find((i) => i.icon === "truck")!;
    expect(delivery.body).toMatch(/valid prescription/i);
    expect(ta.services.items.find((i) => i.icon === "truck")!.body).toMatch(/மருந்துச் சீட்ட/);
  });
});
