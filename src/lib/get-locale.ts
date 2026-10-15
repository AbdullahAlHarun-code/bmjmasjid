import { cookies } from "next/headers";
import { cache } from "react";
import type { Locale } from "@/config/mosque";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/locale";

export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_COOKIE)?.value);
});
