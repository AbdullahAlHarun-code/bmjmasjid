/** Map Bangla digits to Latin digits; leave other characters unchanged. */
export function normalizeDigits(input: string): string {
  const map: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return Array.from(input)
    .map((ch) => map[ch] ?? ch)
    .join("");
}

/** Normalize TrxID for duplicate detection without inventing a fixed format. */
export function normalizeTrxId(raw: string): string {
  return normalizeDigits(raw).trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Parse a BDT amount to integer poisha (1/100 taka).
 * Accepts Bangla/Latin digits, optional commas, and up to 2 decimal places.
 */
export function parseAmountToPoisha(raw: string): number | null {
  const cleaned = normalizeDigits(raw)
    .trim()
    .replace(/,/g, "")
    .replace(/৳/g, "")
    .replace(/\s+/g, "");
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const taka = Number.parseInt(whole, 10);
  if (!Number.isFinite(taka) || taka < 0) return null;
  const poishaPart = Number.parseInt((frac + "00").slice(0, 2), 10);
  const poisha = taka * 100 + poishaPart;
  if (!Number.isSafeInteger(poisha) || poisha <= 0) return null;
  return poisha;
}
