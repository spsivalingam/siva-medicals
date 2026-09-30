# Siva Medicals website

Bilingual (English + தமிழ்) static website for a neighbourhood pharmacy. Built with Astro 7 and Tailwind CSS 4; ships almost no JavaScript.

## Edit the pharmacy's details

1. Open `src/data/site.ts` and replace every value marked `// TODO: replace` (the WhatsApp number must be a mobile registered on WhatsApp)
   (name, phone, WhatsApp, email, address, map coordinates, hours, since year).
2. Set your real domain in `astro.config.mjs` → `site`.
3. Wording lives in `src/i18n/en.ts` and `src/i18n/ta.ts`. Please have a native Tamil speaker proofread `ta.ts`.
4. Regenerate the social preview image: `npm run og` (edit text in `scripts/og-image.mjs` first).

Run `npm run check:live` to confirm nothing is left. Keep name, address and phone **exactly** the same as your Google Business Profile.

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
   Build command `npm run check:live && npm run build`, deploy command `npx wrangler deploy`.
   `check:live` stops the deploy while any sample value (`XXXXX`, `.example`, `98765 43210`, `TODO: replace`) is left.
3. Every push to `main` redeploys. Add a custom domain under the Worker's **Settings → Domains & Routes**.

Or from your machine: `npx wrangler login` then `npm run deploy`.

### GitHub Pages (alternative)

Add `.github/workflows/pages.yml` using `withastro/action` and enable Pages → *GitHub Actions* in repo settings.
If served from `https://<user>.github.io/<repo>/`, also set `base: "/<repo>"` in `astro.config.mjs`.

## Compliance notes

- Informational site only: no online sale of medicines, no prices for prescription drugs, no therapeutic claims.
- No forms or cookies; the site collects no personal data. Prescriptions are shared via WhatsApp.
