import type { ProjectAsset } from "@/config/assets";
import type { Locale } from "@/config/mosque";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS: Record<Locale, readonly string[]> = {
  bn: [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

function toBengaliDigits(value: number) {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

/**
 * Formats a confirmed photo date for display.
 * Accepts only a real `YYYY-MM-DD` calendar date. Returns null when the value
 * is missing or not a valid date, so the UI can omit the row.
 */
export function formatPhotoDate(iso: string | undefined, locale: Locale): string | null {
  if (!iso) return null;
  const match = ISO_DATE.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  const monthName = MONTHS[locale][month - 1];
  if (locale === "bn") {
    return `${toBengaliDigits(day)} ${monthName} ${toBengaliDigits(year)}`;
  }
  return `${day} ${monthName} ${year}`;
}

export function hasPhotoMeta(asset: ProjectAsset, locale: Locale) {
  return (
    formatPhotoDate(asset.takenAt, locale) !== null ||
    formatPhotoDate(asset.lastVerifiedAt, locale) !== null
  );
}
