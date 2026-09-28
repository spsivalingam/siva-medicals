// Detects sample values that must be replaced before the site goes live.
const MARKERS = ["XXXXX", ".example", "98765 43210", "0000 0000", "TODO: replace"];

/** @param {string} text @returns {string[]} markers found in text */
export function findPlaceholders(text) {
  return MARKERS.filter((m) => text.includes(m));
}
