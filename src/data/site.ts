import type { DayHours } from "../lib/hours";

// TODO: replace every placeholder value in this file with the pharmacy's real details.
// Keep name/address/phone identical to the Google Business Profile listing.
export const site = {
  name: { en: "Sri Arogya Pharmacy", ta: "ஸ்ரீ ஆரோக்யா மருந்தகம்" },
  phone: "+91 98765 43210", // TODO: replace
  whatsapp: "+91 98765 43210", // TODO: replace — must be a mobile number registered on WhatsApp
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
