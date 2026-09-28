import { describe, expect, it } from "vitest";
import { findPlaceholders } from "../../scripts/placeholders.mjs";

describe("findPlaceholders", () => {
  it("flags XXXXX licence numbers, .example domains, the sample phone and TODO markers", () => {
    const found = findPlaceholders(
      'form20: "TN/CBE/20/XXXXX", email: "a@b.example", phone: "+91 98765 43210", // TODO: replace',
    );
    expect(found).toEqual(expect.arrayContaining(["XXXXX", ".example", "98765 43210", "TODO: replace"]));
  });
  it("returns nothing for real-looking data", () => {
    expect(findPlaceholders('form20: "TN/CBE/20/10482", site: "https://sriarogya.in", phone: "+91 94430 11223"')).toEqual([]);
  });
});
