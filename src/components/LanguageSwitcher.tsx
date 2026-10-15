"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/config/mosque";
import { LOCALE_COOKIE } from "@/lib/locale";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  labelBn: string;
  labelEn: string;
  compact?: boolean;
};

function setLocaleCookie(next: Locale) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function LanguageSwitcher({
  locale,
  label,
  labelBn,
  labelEn,
  compact = false,
}: LanguageSwitcherProps) {
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-1"
          : "inline-flex items-center gap-2"
      }
      role="group"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <button
        type="button"
        onClick={() => switchTo("bn")}
        aria-pressed={locale === "bn"}
        className={`min-h-12 min-w-12 rounded-[var(--bm-radius-sm)] px-3 text-sm font-semibold transition-colors ${
          locale === "bn"
            ? "bg-[color:var(--bm-primary)] text-white"
            : "text-[color:var(--bm-text-secondary)] hover:bg-[color:var(--bm-primary)]/8 hover:text-[color:var(--bm-primary)]"
        }`}
      >
        {labelBn}
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        className={`min-h-12 min-w-12 rounded-[var(--bm-radius-sm)] px-3 text-sm font-semibold transition-colors ${
          locale === "en"
            ? "bg-[color:var(--bm-primary)] text-white"
            : "text-[color:var(--bm-text-secondary)] hover:bg-[color:var(--bm-primary)]/8 hover:text-[color:var(--bm-primary)]"
        }`}
      >
        {labelEn}
      </button>
    </div>
  );
}
