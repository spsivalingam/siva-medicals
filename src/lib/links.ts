import type { Site } from "../data/site";

/** Returns "91" + 10-digit national number. Throws if the input can't be an Indian number. */
export function normalizeIndianPhone(input: string): string {
  let digits = input.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (!/^\d{10}$/.test(digits)) throw new Error(`Invalid Indian phone number: "${input}"`);
  return `91${digits}`;
}

export const telLink = (phone: string): string => `tel:+${normalizeIndianPhone(phone)}`;

export function waLink(phone: string, message?: string): string {
  const number = normalizeIndianPhone(phone);
  if (!/^91[6-9]\d{9}$/.test(number)) {
    throw new Error(`WhatsApp needs an Indian mobile number (starting 6-9), got "${phone}"`);
  }
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const mapsLink = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function mapsQuery(site: Site): string {
  const a = site.address;
  return `${site.name.en}, ${a.street.en}, ${a.area.en}, ${a.city.en} ${a.postalCode}`;
}
