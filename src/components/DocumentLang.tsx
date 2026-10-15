"use client";

import { useEffect } from "react";
import type { Locale } from "@/config/mosque";

/** Keeps <html lang> aligned after client navigations / locale refresh. */
export function DocumentLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
