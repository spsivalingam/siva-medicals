import type { DayHours } from "../lib/hours";

// TODO: replace every placeholder value in this file with the pharmacy's real details.
// Keep name/address/phone identical to the Google Business Profile listing.
export const site = {
  name: { en: "Siva Medicals", ta: "சிவா மெடிகல்ஸ்" },
  phone: "+91 99416 00345",
  whatsapp: "+91 99416 00345",
  email: "sivamedizone@gmail.com", // TODO: replace
  address: {
    street: { en: "49, Jaganathan nagar, 16, Valluvar Salai, Jai Nagar,", ta: "49, ஜெகநாதன் நகர், 16, வள்ளுவர் சாலை, ஜெய் நகர்," },
    area: { en: "Arumbakkam", ta: "அரும்பாக்கம்" },
    city: { en: "Chennai", ta: "சென்னை" },
    region: { en: "Tamil Nadu", ta: "தமிழ்நாடு" },
    postalCode: "600106",
    country: "IN",
  },
  geo: { lat: 13.07287000353856, lng: 80.2079675720745 },
  hours: [
    { day: 1, open: "09:00", close: "23:00" },
    { day: 2, open: "09:00", close: "23:00" },
    { day: 3, open: "09:00", close: "23:00" },
    { day: 4, open: "09:00", close: "23:00" },
    { day: 5, open: "09:00", close: "23:00" },
    { day: 6, open: "09:00", close: "23:00" },
    { day: 0, open: "09:00", close: "23:00" },
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
