import { describe, expect, it } from "vitest";
import { site } from "../../src/data/site";
import { normalizeIndianPhone } from "../../src/lib/links";
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
    expect(s.telephone).toBe(`+${normalizeIndianPhone(site.phone)}`);
    expect(s.address).toMatchObject({
      "@type": "PostalAddress",
      postalCode: site.address.postalCode,
      addressCountry: "IN",
      addressLocality: site.address.city.en,
    });
  });

  it("has geo and one opening spec per configured slot", () => {
    expect(s.geo).toEqual({ "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng });
    expect(s.openingHoursSpecification).toHaveLength(site.hours.length);
    expect(s.openingHoursSpecification[0]).toEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][site.hours[0].day]}`,
      opens: site.hours[0].open,
      closes: site.hours[0].close,
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
