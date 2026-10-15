/**
 * Single typed source for editable mosque and campaign information.
 * Unknown values stay null — do not invent committee, contact, totals, or payment status.
 */

export type Locale = "bn" | "en";

export type LocalizedString = {
  bn: string;
  en: string;
};

export type MosqueConfig = {
  defaultLocale: Locale;
  name: LocalizedString;
  shortName: LocalizedString;
  address: LocalizedString;
  location: {
    upazila: LocalizedString;
    district: LocalizedString;
    country: LocalizedString;
  };
  founderAndLandDonor: LocalizedString;
  /** Contribution note supplied for the campaign site — no invented biography. */
  founderContribution: LocalizedString;
  campaign: {
    /** Target amount in BDT (integer taka). */
    targetAmountBdt: number;
    targetDisplay: LocalizedString;
    /** Verified received total — unknown until donation records exist. */
    receivedAmountBdt: number | null;
  };
  audienceNote: LocalizedString;
  /** Unknown until provided by the mosque committee. */
  committee: null;
  /** Unknown until a current contact is confirmed. */
  contact: null;
  /** Unknown until a construction budget is confirmed. */
  constructionBudgetBdt: number | null;
  /** Payments are not available in Step 1. */
  paymentsAvailable: false | null;
};

export const mosqueConfig: MosqueConfig = {
  defaultLocale: "bn",
  name: {
    bn: "বাইতুল মামুর জামে মসজিদ",
    en: "Baitul Mamur Jame Masjid",
  },
  shortName: {
    bn: "বাইতুল মামুর",
    en: "Baitul Mamur",
  },
  address: {
    bn: "পৌরসভা ২নং ওয়ার্ড, কলেজ রোড, ভেদরগঞ্জ, শরীয়তপুর, বাংলাদেশ",
    en: "Pourashava Ward No. 2, College Road, Bhedarganj, Shariatpur, Bangladesh",
  },
  location: {
    upazila: {
      bn: "ভেদরগঞ্জ",
      en: "Bhedarganj",
    },
    district: {
      bn: "শরীয়তপুর",
      en: "Shariatpur",
    },
    country: {
      bn: "বাংলাদেশ",
      en: "Bangladesh",
    },
  },
  founderAndLandDonor: {
    bn: "মরহুম নুরুল হক বেপারী",
    en: "Late Nurul Haque Bepari",
  },
  founderContribution: {
    bn: "মরহুম নুরুল হক বেপারী বাইতুল মামুর জামে মসজিদের প্রতিষ্ঠাতা ও জমিদাতা। তিনি এখন পর্যন্ত নির্মাণের বেশির ভাগ ব্যয় নিজে বহন করেছেন।",
    en: "The late Nurul Haque Bepari is the founder and land donor of Baitul Mamur Jame Masjid. He has personally borne most of the construction costs so far.",
  },
  campaign: {
    targetAmountBdt: 2_000_000,
    targetDisplay: {
      bn: "৳২০,০০,০০০",
      en: "BDT 2,000,000",
    },
    receivedAmountBdt: null,
  },
  audienceNote: {
    bn: "বাংলাদেশ ও বিশ্বের প্রবাসী বাংলাদেশিদের জন্য, যার মধ্যে ইতালি, যুক্তরাষ্ট্র ও মধ্যপ্রাচ্য অন্তর্ভুক্ত।",
    en: "For Bangladeshis in Bangladesh and worldwide, including Italy, the USA, and the Middle East.",
  },
  committee: null,
  contact: null,
  constructionBudgetBdt: null,
  paymentsAvailable: null,
};

export function t(value: LocalizedString, locale: Locale = mosqueConfig.defaultLocale): string {
  return value[locale];
}
