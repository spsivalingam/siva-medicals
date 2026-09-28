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
