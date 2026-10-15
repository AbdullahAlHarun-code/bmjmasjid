import { mosqueConfig, type Locale } from "@/config/mosque";
import { contentBn } from "./bn";
import { contentEn } from "./en";
import type { SiteContent } from "./types";

const catalogs: Record<Locale, SiteContent> = {
  bn: contentBn,
  en: contentEn,
};

/** Returns page copy for a locale. Bangla is the site default. */
export function getContent(locale: Locale = mosqueConfig.defaultLocale): SiteContent {
  return catalogs[locale];
}

export type {
  SiteContent,
  PageCopy,
  AboutContent,
  ConstructionContent,
  UpdatesContent,
  SupportContent,
  BkashSupportCopy,
  DonationReportCopy,
  TransparencyContent,
  ContactContent,
  PrivacyContent,
  DonationPolicyContent,
  ShareContent,
} from "./types";
