# Pharmacy Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, bilingual (English + Tamil) single-page static website for a South Indian retail pharmacy whose job is to get the store found and contacted.

**Architecture:** Astro 7 static site. All business details live in `src/data/site.ts`; all UI copy lives in two typed dictionaries (`src/i18n/en.ts`, `src/i18n/ta.ts`). Pure helpers in `src/lib/` (links, hours, schema) are unit-tested; section components are thin and read only from those sources. Output is plain HTML/CSS in `dist/`, deployed to Cloudflare Workers static assets.

**Tech Stack:** Node 22, Astro 7.3.x, Tailwind CSS 4.3.x (`@tailwindcss/vite`), `@lucide/astro` icons, `@astrojs/sitemap`, TypeScript 6 + `@astrojs/check`, Vitest 5, Playwright 1.63 + `@axe-core/playwright` 4.13, `@lhci/cli` 0.15, Wrangler 4.

**Spec:** `docs/superpowers/specs/2026-09-27-pharmacy-website-design.md`

## Global Constraints

- Routes: `/` (English), `/ta/` (Tamil), `/404`; `defaultLocale: "en"`, `prefixDefaultLocale: false`.
- Lighthouse mobile ≥ 0.9 in Performance, Accessibility, Best Practices, SEO.
- Zero serious/critical axe violations on `/` and `/ta/`.
- Page weight ≤ 300 KB excluding cached fonts; shipped JS ≤ 5 KB.
- Tap targets ≥ 44px; WCAG 2.2 AA contrast; one `<h1>` per page; `lang="ta-IN"` on Tamil page.
- Every business detail in `src/data/site.ts`; no string literals for UI copy inside components.
- A missing Tamil key must be a TypeScript error (`ta` typed as `Dict = typeof en`).
- Informational only: no prices for Rx drugs, no therapeutic claims, no forms, no personal data collected.
- Placeholder values are marked `// TODO: replace` and use visible `XXXXX` for licence numbers.
- TypeScript must stay on `^6` (`@astrojs/check` peer: `^5 || ^6`).
- Commits: no Claude/AI attribution trailer (user's global rule).
- Node ≥ 22.12 (Astro 7 engine requirement).

## Review Focus

1. Phone numbers written as `+91 98765 43210`, `098765 43210`, `9876543210`, or a landline `0422 2345678` → `tel:` and `wa.me` links use `91` + 10 digits, no `+`/spaces/leading zero; an invalid number fails the build. (Test in Task 2.)
2. A visitor whose phone/laptop is not on IST (NRI relative, misconfigured device) → "Open now" badge still follows IST. (Test in Task 3.)
3. Late-night check just past closing, overnight hours, and Sunday-afternoon closure → badge correct at each edge. (Test in Task 3.)
4. Long Tamil words on a 320px-wide phone → no horizontal scroll on either page. (Test in Task 7.)
5. JavaScript disabled or badge script fails → full hours table still visible, no empty/stale badge. (Test in Task 7.)

---

## File Structure

```
package.json, astro.config.mjs, tsconfig.json, vitest.config.ts,
playwright.config.ts, lighthouserc.json, wrangler.jsonc, .gitignore, .nvmrc
src/data/site.ts            business details (single source of truth)
src/lib/links.ts            normalizeIndianPhone, telLink, waLink, mapsLink
src/lib/hours.ts            DayHours, istParts, isOpenAt, formatTime, weekRows
src/lib/schema.ts           buildPharmacySchema
src/i18n/en.ts, ta.ts       UI copy dictionaries
src/i18n/utils.ts           Locale, t, getLocaleFromUrl, localePath, alternatePath
src/styles/global.css       Tailwind import + font tokens
src/layouts/Base.astro      <html>, meta, hreflang, OG, fonts, JSON-LD
src/components/Home.astro   composes sections for a locale
src/components/{Header,Hero,Services,WhyUs,Hours,Location,Contact,Footer}.astro
src/pages/index.astro, src/pages/ta/index.astro, src/pages/404.astro, src/pages/robots.txt.ts
public/favicon.svg, public/og-image.png
scripts/og-image.mjs
tests/unit/*.test.ts, tests/e2e/*.spec.ts
.github/workflows/ci.yml, README.md
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `.nvmrc`, `.gitignore`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/styles/global.css`, `src/pages/index.astro` (temporary)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test:unit`, `test:e2e`, `test`, `lhci`, `deploy`; CSS variables `--font-noto-sans`, `--font-noto-tamil`; Tailwind `font-sans` token.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "sri-arogya-pharmacy",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test": "npm run test:unit && npm run build && npm run test:e2e",
    "lhci": "lhci autorun",
    "og": "node scripts/og-image.mjs",
    "deploy": "npm run build && wrangler deploy"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm i astro@^7.3.5 @astrojs/sitemap@^3.7.4 tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 @lucide/astro@^1.48.0
npm i -D @astrojs/check@^0.9.10 typescript@^6 vitest@^5.0.2 @playwright/test@^1.63.0 @axe-core/playwright@^4.13.0 @lhci/cli@^0.15.1 wrangler@^4.141.0
npx playwright install chromium
```

- [ ] **Step 3: Write config files**

`.nvmrc`
```
22
```

`.gitignore`
```
node_modules/
dist/
.astro/
.wrangler/
test-results/
playwright-report/
.lighthouseci/
.DS_Store
```

`astro.config.mjs`
```js
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // TODO: replace with the real domain once deployed
  site: "https://sri-arogya-pharmacy.pages.example",
  i18n: {
    locales: ["en", "ta"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en-IN", ta: "ta-IN" } } }),
  ],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans",
      cssVariable: "--font-noto-sans",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans Tamil",
      cssVariable: "--font-noto-tamil",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["tamil"],
      fallbacks: ["sans-serif"],
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
```
If `astro build` rejects the `fonts` shape, check https://docs.astro.build/en/guides/fonts/ and adjust only the option names; keep the two `cssVariable` names unchanged.

`tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

`vitest.config.ts`
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"] },
});
```

`src/styles/global.css`
```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-noto-sans), var(--font-noto-tamil), system-ui, sans-serif;
}

html {
  scroll-behavior: smooth;
}
```

`src/pages/index.astro` (temporary, replaced in Task 6)
```astro
---
import "../styles/global.css";
---
<!doctype html>
<html lang="en-IN">
  <head><meta charset="utf-8" /><title>Scaffold</title></head>
  <body><h1 class="font-sans text-teal-800">Scaffold OK</h1></body>
</html>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `astro check` reports 0 errors; `dist/index.html` exists and contains `Scaffold OK`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 + Tailwind 4 project"
```

---

### Task 2: Business data and contact links

**Files:**
- Create: `src/lib/hours.ts` (type only for now), `src/data/site.ts`, `src/lib/links.ts`
- Test: `tests/unit/links.test.ts`

**Interfaces:**
- Produces:
  - `type DayHours = { day: 0|1|2|3|4|5|6; open: string; close: string }` (0 = Sunday; `"HH:MM"` IST; `close <= open` ⇒ closes after midnight)
  - `site` const and `type Site = typeof site`
  - `normalizeIndianPhone(input: string): string` → `"91XXXXXXXXXX"`; throws on invalid
  - `telLink(phone: string): string` → `"tel:+91XXXXXXXXXX"`
  - `waLink(phone: string, message?: string): string`
  - `mapsLink(query: string): string`
  - `mapsQuery(site: Site): string`

- [ ] **Step 1: Write the failing test** — `tests/unit/links.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { mapsLink, normalizeIndianPhone, telLink, waLink } from "../../src/lib/links";

describe("normalizeIndianPhone", () => {
  it.each([
    ["+91 98765 43210", "919876543210"],
    ["098765 43210", "919876543210"],
    ["9876543210", "919876543210"],
    ["91-98765-43210", "919876543210"],
    ["0422 2345678", "914222345678"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeIndianPhone(input)).toBe(expected);
  });

  it("throws on too few digits", () => {
    expect(() => normalizeIndianPhone("98765")).toThrow(/Invalid Indian phone/);
  });
});

describe("links", () => {
  it("builds tel link with +91", () => {
    expect(telLink("98765 43210")).toBe("tel:+919876543210");
  });

  it("builds wa.me link without message", () => {
    expect(waLink("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });

  it("URL-encodes Tamil message text", () => {
    const url = waLink("9876543210", "வணக்கம் hi");
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toBe("வணக்கம் hi");
    expect(url).not.toContain(" ");
  });

  it("builds Google Maps search link", () => {
    expect(mapsLink("A & B, Coimbatore")).toBe(
      "https://www.google.com/maps/search/?api=1&query=A%20%26%20B%2C%20Coimbatore",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/links.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/links`.

- [ ] **Step 3: Implement**

`src/lib/hours.ts`
```ts
/** 0 = Sunday … 6 = Saturday. Times are "HH:MM" in IST. close <= open means closing after midnight. */
export type DayHours = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; open: string; close: string };
```

`src/data/site.ts`
```ts
import type { DayHours } from "../lib/hours";

// TODO: replace every placeholder value in this file with the pharmacy's real details.
// Keep name/address/phone identical to the Google Business Profile listing.
export const site = {
  name: { en: "Sri Arogya Pharmacy", ta: "ஸ்ரீ ஆரோக்யா மருந்தகம்" },
  phone: "+91 98765 43210", // TODO: replace
  whatsapp: "+91 98765 43210", // TODO: replace
  email: "hello@sriarogya.example", // TODO: replace
  address: {
    street: { en: "12, Gandhi Road", ta: "12, காந்தி சாலை" },
    area: { en: "RS Puram", ta: "ஆர்.எஸ். புரம்" },
    city: { en: "Coimbatore", ta: "கோயம்புத்தூர்" },
    region: { en: "Tamil Nadu", ta: "தமிழ்நாடு" },
    postalCode: "641002",
    country: "IN",
  },
  geo: { lat: 11.0082, lng: 76.9497 }, // TODO: replace
  hours: [
    { day: 1, open: "08:00", close: "22:30" },
    { day: 2, open: "08:00", close: "22:30" },
    { day: 3, open: "08:00", close: "22:30" },
    { day: 4, open: "08:00", close: "22:30" },
    { day: 5, open: "08:00", close: "22:30" },
    { day: 6, open: "08:00", close: "22:30" },
    { day: 0, open: "09:00", close: "13:00" },
  ] satisfies DayHours[] as readonly DayHours[],
  licences: {
    form20: "TN/CBE/20/XXXXX", // TODO: replace
    form21: "TN/CBE/21/XXXXX", // TODO: replace
    gstin: "33XXXXXXXXXXXZX", // TODO: replace
    pharmacist: {
      name: { en: "R. Lakshmi, B.Pharm", ta: "ர. லட்சுமி, பி.பார்ம்" }, // TODO: replace
      regNo: "TNPC-XXXXX", // TODO: replace
    },
  },
  priceRange: "₹",
} as const;

export type Site = typeof site;
```

`src/lib/links.ts`
```ts
import type { Site } from "../data/site";

/** Returns "91" + 10-digit national number. Throws if the input can't be an Indian number. */
export function normalizeIndianPhone(input: string): string {
  let digits = input.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (!/^\d{10}$/.test(digits)) throw new Error(`Invalid Indian phone number: "${input}"`);
  return `91${digits}`;
}

export const telLink = (phone: string): string => `tel:+${normalizeIndianPhone(phone)}`;

export function waLink(phone: string, message?: string): string {
  const base = `https://wa.me/${normalizeIndianPhone(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const mapsLink = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function mapsQuery(site: Site): string {
  const a = site.address;
  return `${site.name.en}, ${a.street.en}, ${a.area.en}, ${a.city.en} ${a.postalCode}`;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/links.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/data src/lib tests/unit/links.test.ts
git commit -m "feat: add business data and phone/WhatsApp/maps link helpers"
```

---

### Task 3: Opening hours logic

**Files:**
- Modify: `src/lib/hours.ts`
- Test: `tests/unit/hours.test.ts`

**Interfaces:**
- Consumes: `DayHours`, `site.hours`
- Produces:
  - `istParts(date: Date): { day: number; minutes: number }`
  - `isOpenAt(date: Date, hours: readonly DayHours[]): boolean`
  - `formatTime(hhmm: string, locale: "en" | "ta"): string`
  - `weekRows(hours: readonly DayHours[]): { day: number; slots: DayHours[] }[]` — ordered Mon→Sun

- [ ] **Step 1: Write the failing test** — `tests/unit/hours.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { formatTime, isOpenAt, istParts, weekRows, type DayHours } from "../../src/lib/hours";

const hours: DayHours[] = [
  { day: 1, open: "08:00", close: "22:30" },
  { day: 0, open: "09:00", close: "13:00" },
  { day: 5, open: "20:00", close: "02:00" }, // Friday overnight
];

// Helper: IST wall-clock → Date (IST = UTC+05:30)
const ist = (iso: string) => new Date(`${iso}+05:30`);

describe("istParts", () => {
  it("converts UTC to IST day/minutes regardless of host TZ", () => {
    // 2026-09-27 (Sunday) 20:00 UTC = Monday 01:30 IST
    expect(istParts(new Date("2026-09-27T20:00:00Z"))).toEqual({ day: 1, minutes: 90 });
  });
});

describe("isOpenAt", () => {
  it("open Monday 10:30 IST", () => expect(isOpenAt(ist("2026-09-28T10:30:00"), hours)).toBe(true));
  it("open at exact opening minute", () => expect(isOpenAt(ist("2026-09-28T08:00:00"), hours)).toBe(true));
  it("closed at exact closing minute", () => expect(isOpenAt(ist("2026-09-28T22:30:00"), hours)).toBe(false));
  it("closed Monday 22:31", () => expect(isOpenAt(ist("2026-09-28T22:31:00"), hours)).toBe(false));
  it("closed Sunday 15:00", () => expect(isOpenAt(ist("2026-09-27T15:00:00"), hours)).toBe(false));
  it("open Sunday 12:59", () => expect(isOpenAt(ist("2026-09-27T12:59:00"), hours)).toBe(true));
  it("closed on a day with no entry (Tuesday)", () =>
    expect(isOpenAt(ist("2026-09-29T11:00:00"), hours)).toBe(false));
  it("overnight: open Friday 23:00", () => expect(isOpenAt(ist("2026-10-02T23:00:00"), hours)).toBe(true));
  it("overnight: open Saturday 01:59", () => expect(isOpenAt(ist("2026-10-03T01:59:00"), hours)).toBe(true));
  it("overnight: closed Saturday 02:00", () => expect(isOpenAt(ist("2026-10-03T02:00:00"), hours)).toBe(false));
  it("uses IST even for a UTC timestamp (Mon 03:00 UTC = 08:30 IST)", () =>
    expect(isOpenAt(new Date("2026-09-28T03:00:00Z"), hours)).toBe(true));
});

describe("formatTime", () => {
  const norm = (s: string) => s.replace(/\s/g, " ").toLowerCase();
  it("formats English 12-hour", () => expect(norm(formatTime("22:30", "en"))).toBe("10:30 pm"));
  it("formats Tamil with a Tamil-locale string", () => {
    const out = formatTime("08:00", "ta");
    expect(out).toContain("8:00");
  });
});

describe("weekRows", () => {
  it("orders Monday..Sunday and includes empty days", () => {
    const rows = weekRows(hours);
    expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows[1].slots).toEqual([]);
    expect(rows[6].slots).toEqual([{ day: 0, open: "09:00", close: "13:00" }]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/hours.test.ts`
Expected: FAIL — `isOpenAt` / `istParts` not exported.

- [ ] **Step 3: Implement** — replace `src/lib/hours.ts`

```ts
/** 0 = Sunday … 6 = Saturday. Times are "HH:MM" in IST. close <= open means closing after midnight. */
export type DayHours = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; open: string; close: string };

const IST_OFFSET_MIN = 330;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Day-of-week and minutes-since-midnight in IST, independent of the device's time zone. */
export function istParts(date: Date): { day: number; minutes: number } {
  const shifted = new Date(date.getTime() + IST_OFFSET_MIN * 60_000);
  return { day: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export function isOpenAt(date: Date, hours: readonly DayHours[]): boolean {
  const { day, minutes } = istParts(date);
  const prevDay = (day + 6) % 7;
  return hours.some((h) => {
    const open = toMinutes(h.open);
    const close = toMinutes(h.close);
    if (close > open) return h.day === day && minutes >= open && minutes < close;
    return (h.day === day && minutes >= open) || (h.day === prevDay && minutes < close);
  });
}

export function formatTime(hhmm: string, locale: "en" | "ta"): string {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekRows(hours: readonly DayHours[]): { day: number; slots: DayHours[] }[] {
  return WEEK_ORDER.map((day) => ({ day, slots: hours.filter((h) => h.day === day) }));
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: PASS (links + hours).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hours.ts tests/unit/hours.test.ts
git commit -m "feat: add IST opening-hours logic"
```

---

### Task 4: i18n dictionaries and helpers

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/ta.ts`, `src/i18n/utils.ts`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Dict = typeof en`
  - `type Locale = "en" | "ta"`, `locales`, `defaultLocale`
  - `t(locale: Locale): Dict`
  - `getLocaleFromUrl(url: URL): Locale`
  - `localePath(locale: Locale, path?: string): string`
  - `alternatePath(url: URL, target: Locale): string`
  - Dict keys used later: `meta.tagline`, `meta.description`, `a11y.skip`, `nav.label`, `nav.switchTo`, `nav.switchToLabel`, `cta.call`, `cta.whatsapp`, `cta.directions`, `cta.whatsappMessage`, `hero.eyebrow`, `hero.title`, `hero.lead`, `services.title`, `services.items[] {icon,title,body}`, `why.title`, `why.items[] {icon,title,body}`, `hours.title`, `hours.days[7]` (index 0 = Sunday), `hours.closed`, `hours.openNow`, `hours.closedNow`, `hours.note`, `location.title`, `location.open`, `contact.title`, `contact.lead`, `contact.phone`, `contact.whatsapp`, `contact.email`, `contact.prescription`, `contact.prescriptionMessage`, `contact.privacy`, `footer.licences`, `footer.form20`, `footer.form21`, `footer.gstin`, `footer.pharmacist`, `footer.regNo`, `footer.disclaimer`, `footer.rights`, `notFound.title`, `notFound.body`, `notFound.home`

- [ ] **Step 1: Write the failing test** — `tests/unit/i18n.test.ts`

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement**

`src/i18n/en.ts`
```ts
export const en = {
  meta: {
    tagline: "Trusted neighbourhood pharmacy",
    description:
      "Genuine medicines, a registered pharmacist on duty, health devices and local home delivery. Call or WhatsApp us.",
  },
  a11y: { skip: "Skip to main content" },
  nav: { label: "Main", switchTo: "தமிழ்", switchToLabel: "தமிழ் — View this page in Tamil" },
  cta: {
    call: "Call now",
    whatsapp: "WhatsApp us",
    directions: "Get directions",
    whatsappMessage: "Hello, I have a question about a medicine.",
  },
  hero: {
    eyebrow: "Registered pharmacist on duty",
    title: "Genuine medicines, close to home",
    lead: "Prescription medicines, everyday health needs and friendly advice. Call or WhatsApp to check availability before you visit.",
  },
  services: {
    title: "What we offer",
    items: [
      { icon: "pill", title: "Prescription medicines", body: "Dispensed by a registered pharmacist against a valid prescription." },
      { icon: "heart", title: "OTC & wellness", body: "Vitamins, first aid, personal care and everyday health essentials." },
      { icon: "baby", title: "Mother & baby care", body: "Baby food, diapers, skincare and maternity essentials." },
      { icon: "device", title: "Health devices", body: "BP monitors, glucometers, thermometers and nebulisers." },
      { icon: "truck", title: "Local home delivery", body: "Order on WhatsApp and we deliver nearby the same day." },
      { icon: "activity", title: "Free BP check", body: "Walk in for a quick blood-pressure reading, no charge." },
    ],
  },
  why: {
    title: "Why families choose us",
    items: [
      { icon: "shield", title: "Genuine stock", body: "Sourced only from licensed distributors." },
      { icon: "badge", title: "Qualified pharmacist", body: "Clear guidance on dosage and timing." },
      { icon: "clock", title: "Open late", body: "Open until 10:30 pm, six days a week." },
      { icon: "smile", title: "Friendly service", body: "We speak Tamil and English." },
    ],
  },
  hours: {
    title: "Opening hours",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    closed: "Closed",
    openNow: "Open now",
    closedNow: "Closed now",
    note: "Hours may change on public holidays. Please call ahead.",
  },
  location: { title: "Find us", open: "Open in Google Maps" },
  contact: {
    title: "Contact us",
    lead: "Have a prescription? Send a photo on WhatsApp and we'll confirm availability.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    prescription: "Send prescription on WhatsApp",
    prescriptionMessage: "Hello, I'd like to check availability for my prescription. I'm attaching a photo.",
    privacy: "This website does not collect personal data. WhatsApp messages are handled under WhatsApp's own terms.",
  },
  footer: {
    licences: "Licences",
    form20: "Drug licence (Form 20)",
    form21: "Drug licence (Form 21)",
    gstin: "GSTIN",
    pharmacist: "Registered pharmacist",
    regNo: "Reg. no.",
    disclaimer:
      "Medicines are dispensed only against a valid prescription where required by law. Information on this site is not medical advice.",
    rights: "All rights reserved.",
  },
  notFound: {
    title: "Page not found",
    body: "Sorry, we couldn't find that page.",
    home: "Go to home page",
  },
};

export type Dict = typeof en;
```

`src/i18n/ta.ts`
```ts
import type { Dict } from "./en";

export const ta: Dict = {
  meta: {
    tagline: "நம்பகமான அருகிலுள்ள மருந்தகம்",
    description:
      "உண்மையான மருந்துகள், பதிவு பெற்ற மருந்தாளர், சுகாதார கருவிகள் மற்றும் அருகில் வீட்டு விநியோகம். எங்களை அழைக்கவும் அல்லது வாட்ஸ்அப் செய்யவும்.",
  },
  a11y: { skip: "முதன்மை உள்ளடக்கத்திற்குச் செல்லவும்" },
  nav: { label: "முதன்மை", switchTo: "English", switchToLabel: "English — இந்தப் பக்கத்தை ஆங்கிலத்தில் காண" },
  cta: {
    call: "இப்போது அழைக்கவும்",
    whatsapp: "வாட்ஸ்அப்",
    directions: "வழி காட்டு",
    whatsappMessage: "வணக்கம், ஒரு மருந்து பற்றி கேட்க வேண்டும்.",
  },
  hero: {
    eyebrow: "பதிவு பெற்ற மருந்தாளர் பணியில்",
    title: "உண்மையான மருந்துகள், உங்கள் அருகிலேயே",
    lead: "மருத்துவர் பரிந்துரை மருந்துகள், அன்றாட சுகாதாரத் தேவைகள் மற்றும் அன்பான ஆலோசனை. வருவதற்கு முன் அழைத்து அல்லது வாட்ஸ்அப் செய்து இருப்பை உறுதிசெய்யுங்கள்.",
  },
  services: {
    title: "எங்கள் சேவைகள்",
    items: [
      { icon: "pill", title: "பரிந்துரை மருந்துகள்", body: "செல்லுபடியான மருந்துச் சீட்டுக்கு பதிவு பெற்ற மருந்தாளரால் வழங்கப்படும்." },
      { icon: "heart", title: "பொது & நலவாழ்வு", body: "வைட்டமின்கள், முதலுதவி, தனிப்பட்ட பராமரிப்பு மற்றும் அன்றாட தேவைகள்." },
      { icon: "baby", title: "தாய் & சேய் பராமரிப்பு", body: "குழந்தை உணவு, டயப்பர், சருமப் பராமரிப்பு மற்றும் மகப்பேறு தேவைகள்." },
      { icon: "device", title: "சுகாதார கருவிகள்", body: "BP மானிட்டர், குளுக்கோமீட்டர், தெர்மாமீட்டர் மற்றும் நெபுலைசர்." },
      { icon: "truck", title: "வீட்டு விநியோகம்", body: "வாட்ஸ்அப்பில் ஆர்டர் செய்யுங்கள், அருகில் அன்றே விநியோகம்." },
      { icon: "activity", title: "இலவச BP பரிசோதனை", body: "நேரில் வந்து இரத்த அழுத்தத்தை இலவசமாக பரிசோதிக்கலாம்." },
    ],
  },
  why: {
    title: "குடும்பங்கள் எங்களை ஏன் தேர்வு செய்கின்றன",
    items: [
      { icon: "shield", title: "உண்மையான மருந்துகள்", body: "உரிமம் பெற்ற விநியோகஸ்தர்களிடமிருந்து மட்டுமே." },
      { icon: "badge", title: "தகுதியான மருந்தாளர்", body: "அளவு மற்றும் நேரம் குறித்து தெளிவான வழிகாட்டல்." },
      { icon: "clock", title: "இரவு வரை திறந்திருக்கும்", body: "வாரத்தில் ஆறு நாட்கள், இரவு 10:30 வரை." },
      { icon: "smile", title: "அன்பான சேவை", body: "தமிழ் மற்றும் ஆங்கிலத்தில் பேசுவோம்." },
    ],
  },
  hours: {
    title: "திறந்திருக்கும் நேரம்",
    days: ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"],
    closed: "விடுமுறை",
    openNow: "இப்போது திறந்துள்ளது",
    closedNow: "இப்போது மூடப்பட்டுள்ளது",
    note: "பொது விடுமுறை நாட்களில் நேரம் மாறலாம். முன்கூட்டியே அழைக்கவும்.",
  },
  location: { title: "எங்கள் இருப்பிடம்", open: "Google Maps-இல் திறக்கவும்" },
  contact: {
    title: "தொடர்பு கொள்ள",
    lead: "மருந்துச் சீட்டு உள்ளதா? வாட்ஸ்அப்பில் புகைப்படம் அனுப்புங்கள், இருப்பை உறுதிசெய்கிறோம்.",
    phone: "தொலைபேசி",
    whatsapp: "வாட்ஸ்அப்",
    email: "மின்னஞ்சல்",
    prescription: "மருந்துச் சீட்டை வாட்ஸ்அப்பில் அனுப்பவும்",
    prescriptionMessage: "வணக்கம், என் மருந்துச் சீட்டில் உள்ள மருந்துகள் இருப்பில் உள்ளதா என அறிய விரும்புகிறேன். புகைப்படம் இணைக்கிறேன்.",
    privacy: "இந்த இணையதளம் தனிப்பட்ட தகவல்களை சேகரிப்பதில்லை. வாட்ஸ்அப் செய்திகள் வாட்ஸ்அப்பின் விதிமுறைகளின்படி கையாளப்படும்.",
  },
  footer: {
    licences: "உரிமங்கள்",
    form20: "மருந்து உரிமம் (படிவம் 20)",
    form21: "மருந்து உரிமம் (படிவம் 21)",
    gstin: "GSTIN",
    pharmacist: "பதிவு பெற்ற மருந்தாளர்",
    regNo: "பதிவு எண்",
    disclaimer:
      "சட்டப்படி தேவைப்படும் இடங்களில் செல்லுபடியான மருந்துச் சீட்டுக்கு மட்டுமே மருந்துகள் வழங்கப்படும். இத்தளத்தில் உள்ள தகவல்கள் மருத்துவ ஆலோசனை அல்ல.",
    rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
  },
  notFound: {
    title: "பக்கம் கிடைக்கவில்லை",
    body: "மன்னிக்கவும், அந்தப் பக்கத்தைக் கண்டுபிடிக்க முடியவில்லை.",
    home: "முகப்புப் பக்கத்திற்குச் செல்லவும்",
  },
};
```

`src/i18n/utils.ts`
```ts
import { en, type Dict } from "./en";
import { ta } from "./ta";

export const locales = ["en", "ta"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const dictionaries: Record<Locale, Dict> = { en, ta };

export const t = (locale: Locale): Dict => dictionaries[locale];

export function getLocaleFromUrl(url: URL): Locale {
  const first = url.pathname.split("/")[1];
  return first === "ta" ? "ta" : "en";
}

export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

export function alternatePath(url: URL, target: Locale): string {
  const withoutLocale = url.pathname.replace(/^\/ta(?=\/|$)/, "") || "/";
  return localePath(target, withoutLocale);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: PASS (links, hours, i18n).

- [ ] **Step 5: Commit**

```bash
git add src/i18n tests/unit/i18n.test.ts
git commit -m "feat: add English and Tamil dictionaries with i18n helpers"
```

---

### Task 5: Pharmacy JSON-LD

**Files:**
- Create: `src/lib/schema.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `Site`, `normalizeIndianPhone`, `Locale`
- Produces: `buildPharmacySchema(site: Site, locale: Locale, pageUrl: string): Record<string, unknown>`

- [ ] **Step 1: Write the failing test** — `tests/unit/schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { site } from "../../src/data/site";
import { buildPharmacySchema } from "../../src/lib/schema";

describe("buildPharmacySchema", () => {
  const s = buildPharmacySchema(site, "en", "https://x.in/") as any;

  it("is a schema.org Pharmacy", () => {
    expect(s["@context"]).toBe("https://schema.org");
    expect(s["@type"]).toBe("Pharmacy");
    expect(s.name).toBe(site.name.en);
    expect(s.url).toBe("https://x.in/");
  });

  it("has E.164 telephone and postal address", () => {
    expect(s.telephone).toBe("+919876543210");
    expect(s.address).toMatchObject({
      "@type": "PostalAddress",
      postalCode: "641002",
      addressCountry: "IN",
      addressLocality: "Coimbatore",
    });
  });

  it("has geo and one opening spec per configured slot", () => {
    expect(s.geo).toEqual({ "@type": "GeoCoordinates", latitude: 11.0082, longitude: 76.9497 });
    expect(s.openingHoursSpecification).toHaveLength(site.hours.length);
    expect(s.openingHoursSpecification[0]).toEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Monday",
      opens: "08:00",
      closes: "22:30",
    });
  });

  it("uses Tamil name and inLanguage for ta", () => {
    const tamil = buildPharmacySchema(site, "ta", "https://x.in/ta/") as any;
    expect(tamil.name).toBe(site.name.ta);
    expect(tamil.address.addressLocality).toBe(site.address.city.ta);
  });

  it("serialises to valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(s))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement** — `src/lib/schema.ts`

```ts
import type { Site } from "../data/site";
import type { Locale } from "../i18n/utils";
import { normalizeIndianPhone } from "./links";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildPharmacySchema(site: Site, locale: Locale, pageUrl: string): Record<string, unknown> {
  const a = site.address;
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: site.name[locale],
    url: pageUrl,
    telephone: `+${normalizeIndianPhone(site.phone)}`,
    email: site.email,
    priceRange: site.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${a.street[locale]}, ${a.area[locale]}`,
      addressLocality: a.city[locale],
      addressRegion: a.region[locale],
      postalCode: a.postalCode,
      addressCountry: a.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[h.day]}`,
      opens: h.open,
      closes: h.close,
    })),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: PASS (all unit tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts tests/unit/schema.test.ts
git commit -m "feat: add schema.org Pharmacy JSON-LD builder"
```

---

### Task 6: Base layout, header, pages and Playwright harness

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Home.astro`, `src/pages/ta/index.astro`, `playwright.config.ts`, `tests/e2e/layout.spec.ts`
- Modify: `src/pages/index.astro` (replace scaffold)

**Interfaces:**
- Consumes: `t`, `localePath`, `alternatePath`, `Locale`, `site`, `telLink`, `buildPharmacySchema`
- Produces: `<Base locale title? description? noindex?>` with `<slot/>`; `<Home locale>`; `data-testid` hooks `lang-toggle`, `header-call`.

- [ ] **Step 1: Write the failing e2e test** — `playwright.config.ts` and `tests/e2e/layout.spec.ts`

`playwright.config.ts`
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4321" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx astro preview --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

`tests/e2e/layout.spec.ts`
```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npx playwright test tests/e2e/layout.spec.ts`
Expected: FAIL — `/ta/` 404, no `lang-toggle`.

- [ ] **Step 3: Implement**

`src/layouts/Base.astro`
```astro
---
import "../styles/global.css";
import { Font } from "astro:assets";
import { site } from "../data/site";
import { localePath, t, type Locale } from "../i18n/utils";
import { buildPharmacySchema } from "../lib/schema";

interface Props {
  locale: Locale;
  title?: string;
  description?: string;
  noindex?: boolean;
}

const { locale, title, description, noindex = false } = Astro.props;
const s = t(locale);
const a = site.address;
const siteUrl = Astro.site ?? new URL("http://127.0.0.1:4321");
const pageTitle = title ?? `${site.name[locale]} — ${s.meta.tagline}, ${a.area[locale]}, ${a.city[locale]}`;
const pageDesc = description ?? `${s.meta.description} ${a.area[locale]}, ${a.city[locale]}.`;
const canonical = new URL(Astro.url.pathname, siteUrl).href;
const enUrl = new URL(localePath("en"), siteUrl).href;
const taUrl = new URL(localePath("ta"), siteUrl).href;
const schema = buildPharmacySchema(site, locale, new URL(localePath(locale), siteUrl).href);
---
<!doctype html>
<html lang={locale === "ta" ? "ta-IN" : "en-IN"}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    <meta name="description" content={pageDesc} />
    {noindex && <meta name="robots" content="noindex" />}
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang="en-IN" href={enUrl} />
    <link rel="alternate" hreflang="ta-IN" href={taUrl} />
    <link rel="alternate" hreflang="x-default" href={enUrl} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="theme-color" content="#0f766e" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={pageDesc} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={new URL("/og-image.png", siteUrl).href} />
    <meta property="og:locale" content={locale === "ta" ? "ta_IN" : "en_IN"} />
    <Font cssVariable="--font-noto-sans" preload />
    <Font cssVariable="--font-noto-tamil" preload={locale === "ta"} />
    <script type="application/ld+json" is:inline set:html={JSON.stringify(schema)} />
  </head>
  <body class="bg-white font-sans text-slate-900 antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
    >{s.a11y.skip}</a>
    <slot />
  </body>
</html>
```

`src/components/Header.astro`
```astro
---
import { Phone } from "@lucide/astro";
import { site } from "../data/site";
import { alternatePath, localePath, t, type Locale } from "../i18n/utils";
import { telLink } from "../lib/links";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const other: Locale = locale === "en" ? "ta" : "en";
---
<header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
  <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
    <a href={localePath(locale)} class="flex min-h-11 items-center gap-2 font-bold text-teal-800">
      <svg aria-hidden="true" viewBox="0 0 24 24" class="h-7 w-7 shrink-0 fill-teal-700">
        <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
      </svg>
      <span class="leading-tight">{site.name[locale]}</span>
    </a>
    <nav aria-label={s.nav.label} class="flex shrink-0 items-center gap-2">
      <a
        href={alternatePath(Astro.url, other)}
        hreflang={other === "ta" ? "ta-IN" : "en-IN"}
        lang={other === "ta" ? "ta-IN" : "en-IN"}
        aria-label={s.nav.switchToLabel}
        data-testid="lang-toggle"
        class="inline-flex min-h-11 items-center rounded-full border border-teal-700 px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >{s.nav.switchTo}</a>
      <a
        href={telLink(site.phone)}
        data-testid="header-call"
        class="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <Phone class="h-4 w-4" aria-hidden="true" />
        <span class="max-sm:sr-only">{s.cta.call}</span>
      </a>
    </nav>
  </div>
</header>
```
Note: on narrow screens the call label is visually hidden but still read by screen readers; the visible icon + accessible name keeps the button ≥ 44px.

`src/components/Home.astro` (sections are appended in Task 7)
```astro
---
import Base from "../layouts/Base.astro";
import Header from "./Header.astro";
import { site } from "../data/site";
import type { Locale } from "../i18n/utils";

interface Props { locale: Locale }
const { locale } = Astro.props;
---
<Base locale={locale}>
  <Header locale={locale} />
  <main id="main">
    <h1 class="px-4 py-10 text-3xl font-bold">{site.name[locale]}</h1>
  </main>
</Base>
```

`src/pages/index.astro`
```astro
---
import Home from "../components/Home.astro";
---
<Home locale="en" />
```

`src/pages/ta/index.astro`
```astro
---
import Home from "../../components/Home.astro";
---
<Home locale="ta" />
```

- [ ] **Step 4: Run tests**

Run: `npm run build && npx playwright test tests/e2e/layout.spec.ts`
Expected: PASS on `desktop` and `mobile` projects.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add base layout, header with language toggle, EN/TA pages and e2e harness"
```

---

### Task 7: Page sections

**Files:**
- Create: `src/components/Hero.astro`, `Services.astro`, `WhyUs.astro`, `Hours.astro`, `Location.astro`, `Contact.astro`, `Footer.astro`, `src/components/Icon.astro`
- Modify: `src/components/Home.astro`
- Test: `tests/e2e/sections.spec.ts`

**Interfaces:**
- Consumes: `t`, `site`, `telLink`, `waLink`, `mapsLink`, `mapsQuery`, `isOpenAt`, `formatTime`, `weekRows`
- Produces: `data-testid` hooks `cta-call`, `cta-whatsapp`, `cta-directions`, `cta-prescription`, `hours-table`, `open-badge` (attribute `data-open-badge`, `data-state="open"|"closed"`)

- [ ] **Step 1: Write the failing test** — `tests/e2e/sections.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test.describe("contact CTAs", () => {
  for (const path of ["/", "/ta/"]) {
    test(`CTAs are correct on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("cta-call")).toHaveAttribute("href", "tel:+919876543210");
      await expect(page.getByTestId("cta-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210\?text=/);
      await expect(page.getByTestId("cta-directions")).toHaveAttribute(
        "href",
        /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
      );
      await expect(page.getByTestId("cta-prescription")).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210\?text=/);
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

test("badge says open on Monday 10:30 IST", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-28T05:00:00Z"));
  await page.goto("/");
  const badge = page.getByTestId("open-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-state", "open");
});

test("badge says closed on Sunday 15:30 IST", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-27T10:00:00Z"));
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npx playwright test tests/e2e/sections.spec.ts`
Expected: FAIL — `cta-call` not found.

- [ ] **Step 3: Implement**

`src/components/Icon.astro`
```astro
---
import {
  Activity, Baby, BadgeCheck, Clock, HeartPulse, Pill, ShieldCheck, Smile, Stethoscope, Truck,
} from "@lucide/astro";

const icons = {
  activity: Activity, baby: Baby, badge: BadgeCheck, clock: Clock, heart: HeartPulse,
  pill: Pill, shield: ShieldCheck, smile: Smile, device: Stethoscope, truck: Truck,
};
export type IconName = keyof typeof icons;

interface Props { name: string; class?: string }
const { name, class: className = "h-6 w-6" } = Astro.props;
const Cmp = icons[name as IconName] ?? Pill;
---
<Cmp class={className} aria-hidden="true" />
```

`src/components/Hero.astro`
```astro
---
import { MapPin, MessageCircle, Phone } from "@lucide/astro";
import { site } from "../data/site";
import { t, type Locale } from "../i18n/utils";
import { mapsLink, mapsQuery, telLink, waLink } from "../lib/links";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const btn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";
---
<section class="bg-gradient-to-b from-teal-50 to-white">
  <div class="mx-auto max-w-5xl px-4 py-12 sm:py-20">
    <p class="mb-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900">{s.hero.eyebrow}</p>
    <h1 class="max-w-2xl text-3xl leading-tight font-bold text-balance text-slate-900 sm:text-5xl">{s.hero.title}</h1>
    <p class="mt-4 max-w-xl text-lg text-slate-700">{s.hero.lead}</p>
    <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a href={telLink(site.phone)} data-testid="cta-call" class={`${btn} bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700`}>
        <Phone class="h-5 w-5" aria-hidden="true" />{s.cta.call}
      </a>
      <a href={waLink(site.whatsapp, s.cta.whatsappMessage)} data-testid="cta-whatsapp" rel="noopener" class={`${btn} bg-green-700 text-white hover:bg-green-800 focus-visible:outline-green-700`}>
        <MessageCircle class="h-5 w-5" aria-hidden="true" />{s.cta.whatsapp}
      </a>
      <a href={mapsLink(mapsQuery(site))} data-testid="cta-directions" rel="noopener" class={`${btn} border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-700`}>
        <MapPin class="h-5 w-5" aria-hidden="true" />{s.cta.directions}
      </a>
    </div>
  </div>
</section>
```

`src/components/Services.astro`
```astro
---
import Icon from "./Icon.astro";
import { t, type Locale } from "../i18n/utils";

interface Props { locale: Locale }
const s = t(Astro.props.locale);
---
<section id="services" aria-labelledby="services-title" class="mx-auto max-w-5xl px-4 py-14">
  <h2 id="services-title" class="text-2xl font-bold sm:text-3xl">{s.services.title}</h2>
  <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {s.services.items.map((item) => (
      <li class="rounded-2xl border border-slate-200 p-5">
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon name={item.icon} />
        </span>
        <h3 class="mt-4 text-lg font-semibold">{item.title}</h3>
        <p class="mt-1 text-slate-700">{item.body}</p>
      </li>
    ))}
  </ul>
</section>
```

`src/components/WhyUs.astro`
```astro
---
import Icon from "./Icon.astro";
import { t, type Locale } from "../i18n/utils";

interface Props { locale: Locale }
const s = t(Astro.props.locale);
---
<section aria-labelledby="why-title" class="bg-slate-50">
  <div class="mx-auto max-w-5xl px-4 py-14">
    <h2 id="why-title" class="text-2xl font-bold sm:text-3xl">{s.why.title}</h2>
    <ul class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {s.why.items.map((item) => (
        <li class="flex gap-3">
          <Icon name={item.icon} class="mt-0.5 h-6 w-6 shrink-0 text-teal-700" />
          <div>
            <h3 class="font-semibold">{item.title}</h3>
            <p class="text-slate-700">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
</section>
```

`src/components/Hours.astro`
```astro
---
import { site } from "../data/site";
import { t, type Locale } from "../i18n/utils";
import { formatTime, weekRows } from "../lib/hours";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const rows = weekRows(site.hours);
---
<section id="hours" aria-labelledby="hours-title" class="mx-auto max-w-5xl px-4 py-14">
  <div class="flex flex-wrap items-center gap-3">
    <h2 id="hours-title" class="text-2xl font-bold sm:text-3xl">{s.hours.title}</h2>
    <p
      data-open-badge
      data-testid="open-badge"
      data-hours={JSON.stringify(site.hours)}
      data-open-text={s.hours.openNow}
      data-closed-text={s.hours.closedNow}
      role="status"
      hidden
      class="inline-flex rounded-full px-3 py-1 text-sm font-semibold data-[state=closed]:bg-red-100 data-[state=closed]:text-red-900 data-[state=open]:bg-green-100 data-[state=open]:text-green-900"
    ></p>
  </div>
  <table data-testid="hours-table" class="mt-6 w-full max-w-md text-left">
    <tbody>
      {rows.map((row) => (
        <tr class="border-b border-slate-200">
          <th scope="row" class="py-2 pr-4 font-medium">{s.hours.days[row.day]}</th>
          <td class="py-2 text-slate-700">
            {row.slots.length === 0
              ? s.hours.closed
              : row.slots.map((h) => `${formatTime(h.open, locale)} – ${formatTime(h.close, locale)}`).join(", ")}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <p class="mt-4 text-sm text-slate-600">{s.hours.note}</p>
</section>

<script>
  import { isOpenAt, type DayHours } from "../lib/hours";

  const el = document.querySelector<HTMLElement>("[data-open-badge]");
  if (el) {
    const hours = JSON.parse(el.dataset.hours ?? "[]") as DayHours[];
    const open = isOpenAt(new Date(), hours);
    el.textContent = (open ? el.dataset.openText : el.dataset.closedText) ?? "";
    el.dataset.state = open ? "open" : "closed";
    el.hidden = false;
  }
</script>
```

`src/components/Location.astro`
```astro
---
import { MapPin } from "@lucide/astro";
import { site } from "../data/site";
import { t, type Locale } from "../i18n/utils";
import { mapsLink, mapsQuery } from "../lib/links";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const a = site.address;
---
<section id="location" aria-labelledby="location-title" class="bg-slate-50">
  <div class="mx-auto grid max-w-5xl gap-6 px-4 py-14 md:grid-cols-2 md:items-center">
    <div>
      <h2 id="location-title" class="text-2xl font-bold sm:text-3xl">{s.location.title}</h2>
      <address class="mt-4 text-lg not-italic text-slate-800">
        {site.name[locale]}<br />
        {a.street[locale]}, {a.area[locale]}<br />
        {a.city[locale]} – {a.postalCode}<br />
        {a.region[locale]}
      </address>
    </div>
    <a
      href={mapsLink(mapsQuery(site))}
      rel="noopener"
      class="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      style="background-image: linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px); background-size: 32px 32px;"
    >
      <span class="flex flex-col items-center gap-2 rounded-xl bg-white/90 px-5 py-4 text-center font-semibold text-teal-900 shadow group-hover:bg-white">
        <MapPin class="h-8 w-8 text-red-600" aria-hidden="true" />
        {s.location.open}
      </span>
    </a>
  </div>
</section>
```
(The map card is a zero-weight CSS illustration linking to Google Maps; swap for a real map screenshot later if desired.)

`src/components/Contact.astro`
```astro
---
import { Mail, MessageCircle, Phone } from "@lucide/astro";
import { site } from "../data/site";
import { t, type Locale } from "../i18n/utils";
import { telLink, waLink } from "../lib/links";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const row = "flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-700";
---
<section id="contact" aria-labelledby="contact-title" class="mx-auto max-w-5xl px-4 py-14">
  <h2 id="contact-title" class="text-2xl font-bold sm:text-3xl">{s.contact.title}</h2>
  <p class="mt-3 max-w-xl text-lg text-slate-700">{s.contact.lead}</p>
  <a
    href={waLink(site.whatsapp, s.contact.prescriptionMessage)}
    data-testid="cta-prescription"
    rel="noopener"
    class="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-green-700 px-5 font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
  >
    <MessageCircle class="h-5 w-5" aria-hidden="true" />{s.contact.prescription}
  </a>
  <ul class="mt-8 grid max-w-md gap-1 text-lg">
    <li><a href={telLink(site.phone)} class={row}><Phone class="h-5 w-5 text-teal-700" aria-hidden="true" /><span class="sr-only">{s.contact.phone}: </span>{site.phone}</a></li>
    <li><a href={waLink(site.whatsapp)} rel="noopener" class={row}><MessageCircle class="h-5 w-5 text-green-700" aria-hidden="true" /><span class="sr-only">{s.contact.whatsapp}: </span>{site.whatsapp}</a></li>
    <li><a href={`mailto:${site.email}`} class={`${row} break-all`}><Mail class="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><span class="sr-only">{s.contact.email}: </span>{site.email}</a></li>
  </ul>
  <p class="mt-6 max-w-xl text-sm text-slate-600">{s.contact.privacy}</p>
</section>
```

`src/components/Footer.astro`
```astro
---
import { site } from "../data/site";
import { t, type Locale } from "../i18n/utils";

interface Props { locale: Locale }
const { locale } = Astro.props;
const s = t(locale);
const l = site.licences;
const year = new Date().getFullYear();
---
<footer class="bg-slate-900 text-slate-200">
  <div class="mx-auto max-w-5xl px-4 py-10 text-sm">
    <h2 class="text-base font-semibold text-white">{s.footer.licences}</h2>
    <dl class="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
      <dt>{s.footer.form20}</dt><dd class="font-mono">{l.form20}</dd>
      <dt>{s.footer.form21}</dt><dd class="font-mono">{l.form21}</dd>
      <dt>{s.footer.gstin}</dt><dd class="font-mono">{l.gstin}</dd>
      <dt>{s.footer.pharmacist}</dt>
      <dd>{l.pharmacist.name[locale]} · {s.footer.regNo} <span class="font-mono">{l.pharmacist.regNo}</span></dd>
    </dl>
    <p class="mt-6 text-slate-300">{s.footer.disclaimer}</p>
    <p class="mt-4 text-slate-400">© {year} {site.name[locale]}. {s.footer.rights}</p>
  </div>
</footer>
```
English labels contain "Form 20"/"Form 21" (asserted by the e2e test); Tamil labels use படிவம் 20/21.

`src/components/Home.astro` (replace)
```astro
---
import Base from "../layouts/Base.astro";
import Contact from "./Contact.astro";
import Footer from "./Footer.astro";
import Header from "./Header.astro";
import Hero from "./Hero.astro";
import Hours from "./Hours.astro";
import Location from "./Location.astro";
import Services from "./Services.astro";
import WhyUs from "./WhyUs.astro";
import type { Locale } from "../i18n/utils";

interface Props { locale: Locale }
const { locale } = Astro.props;
---
<Base locale={locale}>
  <Header locale={locale} />
  <main id="main">
    <Hero locale={locale} />
    <Services locale={locale} />
    <WhyUs locale={locale} />
    <Hours locale={locale} />
    <Location locale={locale} />
    <Contact locale={locale} />
  </main>
  <Footer locale={locale} />
</Base>
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: unit PASS; `astro check` 0 errors; all e2e PASS on desktop + mobile.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add hero, services, why-us, hours, location, contact and footer sections"
```

---

### Task 8: 404, robots, favicon and OG image

**Files:**
- Create: `src/pages/404.astro`, `src/pages/robots.txt.ts`, `public/favicon.svg`, `scripts/og-image.mjs`, `public/og-image.png` (generated)
- Test: `tests/e2e/meta.spec.ts`

**Interfaces:**
- Consumes: `Base`, `t`, `site`

- [ ] **Step 1: Write the failing test** — `tests/e2e/meta.spec.ts`

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npx playwright test tests/e2e/meta.spec.ts`
Expected: FAIL — no 404 page, robots, favicon, og image.

- [ ] **Step 3: Implement**

`src/pages/404.astro`
```astro
---
import Base from "../layouts/Base.astro";
import { en } from "../i18n/en";
import { ta } from "../i18n/ta";
---
<Base locale="en" title={`${en.notFound.title} · ${ta.notFound.title}`} noindex>
  <main id="main" class="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 class="text-3xl font-bold">{en.notFound.title}</h1>
    <p class="mt-2 text-slate-700">{en.notFound.body}</p>
    <p class="mt-6 text-2xl font-bold" lang="ta-IN">{ta.notFound.title}</p>
    <p class="mt-2 text-slate-700" lang="ta-IN">{ta.notFound.body}</p>
    <div class="mt-8 flex flex-col items-center gap-3">
      <a href="/" class="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 font-semibold text-white">{en.notFound.home}</a>
      <a href="/ta/" lang="ta-IN" class="inline-flex min-h-11 items-center rounded-full border border-teal-700 px-5 font-semibold text-teal-800">{ta.notFound.home}</a>
    </div>
  </main>
</Base>
```

`src/pages/robots.txt.ts`
```ts
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL("sitemap-index.xml", site).href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
```

`public/favicon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0f766e"/><path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff"/></svg>
```

`scripts/og-image.mjs`
```js
// Renders public/og-image.png (1200x630) from site data using Playwright's Chromium.
import { chromium } from "@playwright/test";

const html = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;
  background:linear-gradient(135deg,#0f766e,#115e59);font-family:system-ui,sans-serif;color:#fff">
  <div style="padding:80px">
    <div style="font-size:96px;line-height:1">✚</div>
    <div style="font-size:72px;font-weight:800;margin-top:24px">Sri Arogya Pharmacy</div>
    <div style="font-size:40px;opacity:.9;margin-top:12px">ஸ்ரீ ஆரோக்யா மருந்தகம்</div>
    <div style="font-size:32px;opacity:.85;margin-top:32px">RS Puram, Coimbatore · Call / WhatsApp</div>
  </div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("wrote public/og-image.png");
```

Run: `npm run og`
Expected: `wrote public/og-image.png`.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all PASS. If `astro preview` returns 200 instead of 404 for unknown routes, change the status assertion to check the 404 content only and note it — Cloudflare's `not_found_handling: "404-page"` returns 404 in production.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 404 page, robots.txt, favicon and OG image"
```

---

### Task 9: Accessibility and Lighthouse gates

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `lighthouserc.json`

- [ ] **Step 1: Write the test** — `tests/e2e/a11y.spec.ts`

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/ta/", "/nope"]) {
  test(`no serious/critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
```

`lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npx astro preview --host 127.0.0.1 --port 4322",
      "startServerReadyPattern": "4322",
      "url": ["http://127.0.0.1:4322/", "http://127.0.0.1:4322/ta/"],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 5120 }],
        "total-byte-weight": ["warn", { "maxNumericValue": 307200 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

- [ ] **Step 2: Run a11y and fix any violations**

Run: `npm run build && npx playwright test tests/e2e/a11y.spec.ts`
Expected: PASS. If a violation appears, fix the component it names (contrast → darken the colour one Tailwind step; name → add visible text or `aria-label` containing the visible text), rebuild, rerun.

- [ ] **Step 3: Run Lighthouse**

Run: `npm run lhci`
Expected: all assertions pass. If performance < 0.9, check `.lighthouseci/*.html` for the top opportunity (usually font preload or render-blocking CSS) and fix it. If `resource-summary:script:size` fails, confirm only the Hours badge script ships.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: add axe accessibility and Lighthouse CI gates"
```

---

### Task 10: Deployment config, CI and README

**Files:**
- Create: `wrangler.jsonc`, `.github/workflows/ci.yml`, `README.md`

- [ ] **Step 1: Write deploy config** — `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sri-arogya-pharmacy",
  "compatibility_date": "2026-09-27",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

- [ ] **Step 2: Validate deploy config without deploying**

Run: `npm run build && npx wrangler deploy --dry-run`
Expected: dry-run lists uploaded assets from `./dist`, no errors (no login needed for dry run).

- [ ] **Step 3: Write CI** — `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
        env:
          CI: "true"
      - run: npm run lhci
```

- [ ] **Step 4: Write `README.md`**

````markdown
# Sri Arogya Pharmacy website

Bilingual (English + தமிழ்) static website for a neighbourhood pharmacy. Built with Astro 7 and Tailwind CSS 4; ships almost no JavaScript.

## Edit the pharmacy's details

1. Open `src/data/site.ts` and replace every value marked `// TODO: replace`
   (name, phone, WhatsApp, email, address, map coordinates, hours, licence numbers, pharmacist).
2. Set your real domain in `astro.config.mjs` → `site`.
3. Wording lives in `src/i18n/en.ts` and `src/i18n/ta.ts`. Please have a native Tamil speaker proofread `ta.ts`.
4. Regenerate the social preview image: `npm run og` (edit text in `scripts/og-image.mjs` first).

Keep name, address and phone **exactly** the same as your Google Business Profile.

## Develop

```bash
nvm use
npm install
npm run dev        # http://localhost:4321
```

## Test

```bash
npm test           # unit + type check + build + Playwright e2e + axe
npm run lhci       # Lighthouse (mobile) — needs Chrome installed
```

## Deploy (free)

### Cloudflare (recommended — edge servers in Chennai, Bengaluru, Hyderabad, Kochi)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**, pick the repo.
   Build command `npm run build`, deploy command `npx wrangler deploy`.
3. Every push to `main` redeploys. Add a custom domain under the Worker's **Settings → Domains & Routes**.

Or from your machine: `npx wrangler login` then `npm run deploy`.

### GitHub Pages (alternative)

Add `.github/workflows/pages.yml` using `withastro/action` and enable Pages → *GitHub Actions* in repo settings.
If served from `https://<user>.github.io/<repo>/`, also set `base: "/<repo>"` in `astro.config.mjs`.

## Compliance notes

- Informational site only: no online sale of medicines, no prices for prescription drugs, no therapeutic claims.
- Licence and pharmacist details are shown in the footer.
- No forms or cookies; the site collects no personal data. Prescriptions are shared via WhatsApp.
````

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Cloudflare deploy config, CI workflow and README"
```

---

### Task 11: Visual iteration in the browser

**Files:**
- Create: `.claude/launch.json`
- Modify: any component, as findings require

- [ ] **Step 1: Add launch config** — `.claude/launch.json`

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "astro-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 4321 }
  ]
}
```

- [ ] **Step 2: Inspect** — start `astro-dev` in the browser pane; screenshot `/` and `/ta/` at mobile (375×812) and desktop. Checklist:
  - Hero CTAs stack full-width on mobile, row on desktop.
  - Tamil headings wrap cleanly (no clipped glyphs, no overflow).
  - Header fits on one line at 375px in both languages.
  - Open badge colour and text visible.
  - Footer readable; licence numbers don't overflow.

- [ ] **Step 3: Fix issues found**, re-screenshot, then run `npm test`.
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: polish layout after visual review"
```
