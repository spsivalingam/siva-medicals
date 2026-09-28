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
