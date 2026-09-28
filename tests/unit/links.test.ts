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

describe("waLink requires a mobile number", () => {
  it("rejects a landline for WhatsApp with a clear message", () => {
    expect(() => waLink("0422 2345678")).toThrow(/WhatsApp needs an Indian mobile number/);
  });
  it("still allows a landline for tel:", () => {
    expect(telLink("0422 2345678")).toBe("tel:+914222345678");
  });
});
