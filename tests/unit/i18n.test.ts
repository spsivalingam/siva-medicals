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
