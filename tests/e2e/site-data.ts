// Expected values for e2e tests, derived from src/data/site.ts so tests keep passing when the real details change.
import { site } from "../../src/data/site";
import { formatTime, isOpenAt, nextChange } from "../../src/lib/hours";
import { t, type Locale } from "../../src/i18n/utils";
import { normalizeIndianPhone } from "../../src/lib/links";

export { site };
export const phoneDigits = normalizeIndianPhone(site.phone);
export const whatsappDigits = normalizeIndianPhone(site.whatsapp);
export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const WEEK_START = Date.parse("2026-09-28T00:00:00+05:30"); // a Monday, IST

/** First instant in a week (5-minute steps) matching pred, or null if none. */
function findInstant(pred: (d: Date) => boolean): Date | null {
  for (let m = 0; m < 7 * 24 * 60; m += 5) {
    const d = new Date(WEEK_START + m * 60_000);
    if (pred(d)) return d;
  }
  return null;
}

const open = (d: Date) => isOpenAt(d, site.hours);
export const openInstant = () => findInstant(open);
export const closedInstant = () => findInstant((d) => !open(d));
/** An open instant that is closed 6 minutes later. */
export const justBeforeClosing = () => findInstant((d) => open(d) && !open(new Date(d.getTime() + 6 * 60_000)));

export function badgeText(d: Date, locale: Locale): string {
  const h = t(locale).hours;
  const at = nextChange(d, site.hours);
  const template = open(d) ? h.openUntil : h.closedUntil;
  return at ? template.replace("{time}", formatTime(at, locale)) : open(d) ? h.openNow : h.closedNow;
}

/** A closed instant with opening hours both earlier and later on the same IST day (e.g. a lunch break). */
export const midDayBreak = () =>
  findInstant((d) => {
    if (open(d)) return false;
    const dayStart = d.getTime() - (((d.getTime() + 330 * 60_000) % 86_400_000 + 86_400_000) % 86_400_000);
    let before = false;
    let after = false;
    for (let t = dayStart; t < dayStart + 86_400_000; t += 5 * 60_000) {
      if (open(new Date(t))) (t < d.getTime() ? (before = true) : (after = true));
    }
    return before && after;
  });
