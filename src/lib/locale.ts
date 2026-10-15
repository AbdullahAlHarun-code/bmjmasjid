import { mosqueConfig, type Locale } from "@/config/mosque";

export const LOCALE_COOKIE = "bm-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "bn" || value === "en";
}

export function resolveLocale(value?: string | null): Locale {
  return isLocale(value) ? value : mosqueConfig.defaultLocale;
}
