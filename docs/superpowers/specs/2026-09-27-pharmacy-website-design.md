# Pharmacy Website — Design Spec

- **Date:** 2026-09-27
- **Status:** Draft, awaiting review

## 1. Intent

A simple, fast, bilingual (English + Tamil) website for a single retail pharmacy in South India (Tamil Nadu). Its one job is to **get the pharmacy found and contacted**: customers discover it on Google, see what it offers and when it is open, and call, WhatsApp, or get directions in one tap. It must cost nothing to host.

### Stated by the user
- Retail pharmacy, southern India; simple website.
- Purpose: get found & contacted (no online ordering).
- Languages: English + Tamil.
- Placeholder business details for now, easy to replace later.
- Free hosting (GitHub or any free platform); local git for change tracking.
- Iterate using browser-based build/test.

### Assumptions (flag if wrong)
- One physical store (not a chain).
- No backend, database, forms, or user accounts.
- Prescriptions are shared via WhatsApp, not uploaded to the site.
- Most visitors use mid/low-end Android phones on 4G.

### Success criteria
1. Deployed to a free public URL; auto-redeploys on `git push`.
2. Lighthouse (mobile) ≥ 90 in Performance, Accessibility, Best Practices, SEO.
3. Zero axe-core violations (serious/critical) on both language pages.
4. Tamil text renders correctly with Noto Sans Tamil (no tofu boxes).
5. Call (`tel:`), WhatsApp (`wa.me`) and Directions links are correct and tappable on a 360px-wide screen.
6. Every business detail lives in one data file; changing it updates both languages.

## 2. Tech stack (verified 2026-09-27)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro 7.x**, static output | Zero JS by default; built-in i18n routing and Fonts API |
| Styling | **Tailwind CSS 4.x** via `@tailwindcss/vite` | CSS-first config, tiny output |
| Fonts | Astro Fonts API → Noto Sans + Noto Sans Tamil, self-hosted, 400/700 | No third-party font requests; preload only above-the-fold weight |
| Tests | **Vitest** (unit), **Playwright 1.6x** + **@axe-core/playwright** | Unit, E2E + accessibility |
| Perf | **Lighthouse CI (@lhci/cli)** | Mobile-throttled budget checks |
| Hosting | **Cloudflare Workers static assets** (primary) | Free, unlimited static requests, commercial use allowed, edges in Chennai/Bangalore/Hyderabad/Kochi |
| Fallback host | GitHub Pages via Actions | Zero-config alternative; commercial-use terms are a grey area |
| Runtime | Node 22 (local) | Already installed |

Rejected: plain HTML + Vite (manual i18n duplication), Eleventy/Hugo (no built-in fonts/i18n or harder templates), Next.js (React runtime overkill), Vercel Hobby (forbids commercial use).

## 3. Information architecture

Routes (Astro i18n, `defaultLocale: "en"`, `prefixDefaultLocale: false`):

- `/` — English home
- `/ta/` — Tamil home
- `/404` — simple not-found page linking home
- `sitemap-index.xml`, `robots.txt`

Single-page layout; sections in order:

1. **Header** — logo/name, language toggle (EN ⇄ தமிழ்), sticky "Call" button on mobile.
2. **Hero** — name, one-line tagline, primary CTAs: *Call now*, *WhatsApp us*, *Get directions*.
3. **Services** — cards: prescription medicines, OTC & wellness, baby care, health devices (BP/glucometer), home delivery (local), free BP check. Icons are inline SVG.
4. **Why us** — registered pharmacist on duty, genuine medicines, open late, friendly service.
5. **Hours** — weekly table + live "Open now / Closed" badge (tiny inline script, IST-based; renders a neutral state without JS).
6. **Location** — address, static map image linking to Google Maps (no iframe).
7. **Contact** — phone, WhatsApp, email; "Send prescription on WhatsApp" CTA with prefilled message.
8. **Footer** — drug licence nos. (Form 20/21), pharmacist name & registration no., GSTIN, disclaimer ("Medicines dispensed only against a valid prescription where required"), copyright.

## 4. Components & data

```
src/
  data/site.ts          # single source of truth: name, phone, whatsapp, email,
                        # address, geo, hours[], licence nos., social links
  i18n/en.ts, i18n/ta.ts# UI strings keyed identically; typed via shared interface
  i18n/utils.ts         # t(locale), getLocaleFromUrl, alternate URL helper
  lib/links.ts          # telLink(), waLink(msg), mapsLink() — pure functions
  lib/hours.ts          # isOpenAt(date, hours) — pure, IST
  lib/schema.ts         # builds Pharmacy JSON-LD from site.ts
  layouts/Base.astro    # <html lang>, meta, hreflang, OG tags, fonts, JSON-LD
  components/*.astro    # Header, Hero, Services, WhyUs, Hours, Location, Contact, Footer
  pages/index.astro     # English
  pages/ta/index.astro  # Tamil
  styles/global.css     # @import "tailwindcss"; theme tokens
public/                 # favicon, og-image, map image, robots.txt
```

Each section component takes `locale` and reads strings via `t(locale)`; no string literals in components. Missing Tamil keys are a **type error** (shared interface), not a runtime fallback.

## 5. SEO & local search

- `<title>`/meta description per locale; `hreflang` en/ta/x-default; canonical URLs.
- JSON-LD `Pharmacy` (address, geo, telephone, openingHoursSpecification, priceRange, url).
- Open Graph image.
- NAP (name/address/phone) exactly matches what will go on Google Business Profile.

## 6. Performance budget

- Total page weight ≤ 300 KB (excl. fonts cached) ; JS ≤ 5 KB.
- Images: Astro `<Image>` → AVIF/WebP, explicit width/height, lazy below the fold.
- Fonts: WOFF2, `font-display: swap`, subset to latin + tamil.

## 7. Accessibility

- WCAG 2.2 AA contrast; tap targets ≥ 44px; visible focus ring.
- Semantic landmarks, one `<h1>`, `lang="ta"` on Tamil page.
- Language toggle labelled in both languages.

## 8. Legal / compliance

- Informational only; no online sale, no prices for Rx drugs, no therapeutic claims (Drugs & Magic Remedies Act 1954).
- Display licence and pharmacist details (good practice; not confirmed mandatory for websites).
- No personal data collected ⇒ no DPDP consent flow required. WhatsApp CTA notes that messages are handled per WhatsApp's terms.
- Placeholder data is visibly marked in `site.ts` with `// TODO: replace` comments and fake-but-valid-format values.

## 9. Error handling

- No runtime server; failure modes are build-time. TypeScript strict + `astro check` must pass.
- "Open now" badge: if JS disabled or errors, badge is hidden and the static hours table remains.
- 404 page for unknown routes.

## 10. Testing

- **Unit (Vitest):** `links.ts` (phone normalisation, URL-encoding), `hours.ts` (open/closed edges, midnight, Sunday), `schema.ts` shape.
- **E2E (Playwright, Chromium + mobile Pixel viewport):** CTA hrefs, language toggle round-trip, Tamil page `lang` and a Tamil glyph renders with the Tamil font, JSON-LD parses, no console errors.
- **A11y:** axe on `/` and `/ta/`, fail on serious/critical.
- **Perf:** Lighthouse CI mobile, assert ≥ 0.9 all categories.
- **Manual/visual:** in-app browser screenshots at 375px and 1280px, light theme.
- CI: GitHub Actions workflow running build + unit + e2e + axe on push (optional until repo is on GitHub).

## 11. Deployment

- `wrangler.jsonc` with `assets.directory: "./dist"`; deploy via Cloudflare's GitHub integration (Workers Builds) or `npx wrangler deploy`.
- README documents both Cloudflare and GitHub Pages steps. Account creation/login is done by the user.

## 12. Out of scope

Online ordering, catalogue, payments, prescription upload, user accounts, blog/CMS, other regional languages (structure allows adding later), analytics.
