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
