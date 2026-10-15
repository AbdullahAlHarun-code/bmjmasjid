/**
 * Single typed source for editable mosque and campaign information.
 * Unknown values stay null — do not invent committee titles, wallet type,
 * receipt guarantees, or payment-gateway availability.
 */

export type Locale = "bn" | "en";

export type LocalizedString = {
  bn: string;
  en: string;
};

/** Future contact fields — keep null until a current channel is confirmed. */
export type ContactInfo = {
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  officeHours: LocalizedString | null;
  note: LocalizedString | null;
};

/** Future committee listing — keep null until identities are confirmed. */
export type CommitteeInfo = {
  members: ReadonlyArray<{
    name: LocalizedString;
    role: LocalizedString;
  }> | null;
  note: LocalizedString | null;
};

export type CaretakerInfo = {
  name: LocalizedString;
  nickname: LocalizedString;
  displayName: LocalizedString;
  role: LocalizedString;
  relationship: LocalizedString;
};

/**
 * Interim personal bKash details for manual transfers.
 * Kept separate from online gateway availability (`paymentsAvailable`).
 */
export type ManualBkashInfo = {
  available: boolean;
  /** Digits only — used for copy/clipboard. */
  numberDigits: string;
  /** Local display with hyphen, e.g. 01913-331811. */
  numberDisplay: string;
  /** International display, e.g. +880 1913-331811. */
  numberInternational: string;
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
  founderContribution: LocalizedString;
  caretaker: CaretakerInfo;
  manualBkash: ManualBkashInfo;
  campaign: {
    targetAmountBdt: number;
    targetDisplay: LocalizedString;
    receivedAmountBdt: number | null;
  };
  audienceNote: LocalizedString;
  committee: CommitteeInfo | null;
  contact: ContactInfo | null;
  constructionBudgetBdt: number | null;
  /**
   * Online payment gateway checkout — inactive until explicitly enabled.
   * Separate from interim manual bKash (`manualBkash.available`).
   */
  paymentsAvailable: boolean | null;
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
    upazila: { bn: "ভেদরগঞ্জ", en: "Bhedarganj" },
    district: { bn: "শরীয়তপুর", en: "Shariatpur" },
    country: { bn: "বাংলাদেশ", en: "Bangladesh" },
  },
  founderAndLandDonor: {
    bn: "মরহুম নুরুল হক বেপারী",
    en: "Late Nurul Haque Bepari",
  },
  founderContribution: {
    bn: "মরহুম নুরুল হক বেপারী বাইতুল মামুর জামে মসজিদের প্রতিষ্ঠাতা ও জমিদাতা। তিনি এখন পর্যন্ত নির্মাণের বেশির ভাগ ব্যয় নিজে বহন করেছেন।",
    en: "The late Nurul Haque Bepari is the founder and land donor of Baitul Mamur Jame Masjid. He has personally borne most of the construction costs so far.",
  },
  caretaker: {
    name: { bn: "রায়হান আহমেদ", en: "Rayhan Ahmed" },
    nickname: { bn: "শিশির", en: "Shishir" },
    displayName: { bn: "রায়হান আহমেদ (শিশির)", en: "Rayhan Ahmed (Shishir)" },
    role: { bn: "বর্তমান তত্ত্বাবধায়ক", en: "Current caretaker" },
    relationship: {
      bn: "মরহুম প্রতিষ্ঠাতা ও জমিদাতা নুরুল হক বেপারীর ছেলে",
      en: "Son of the late founder and land donor, Nurul Haque Bepari",
    },
  },
  manualBkash: {
    available: true,
    numberDigits: "01913331811",
    numberDisplay: "01913-331811",
    numberInternational: "+880 1913-331811",
  },
  campaign: {
    targetAmountBdt: 2_000_000,
    targetDisplay: { bn: "৳২০,০০,০০০", en: "BDT 2,000,000" },
    receivedAmountBdt: null,
  },
  audienceNote: {
    bn: "বাংলাদেশ ও বিশ্বের প্রবাসী বাংলাদেশিদের জন্য, যার মধ্যে ইতালি, যুক্তরাষ্ট্র ও মধ্যপ্রাচ্য অন্তর্ভুক্ত।",
    en: "For Bangladeshis in Bangladesh and worldwide, including Italy, the USA, and the Middle East.",
  },
  committee: null,
  contact: null,
  constructionBudgetBdt: null,
  paymentsAvailable: false,
};

export function t(value: LocalizedString, locale: Locale = mosqueConfig.defaultLocale): string {
  return value[locale];
}

export function arePaymentsAvailable(): boolean {
  return mosqueConfig.paymentsAvailable === true;
}

export function isManualBkashAvailable(): boolean {
  return mosqueConfig.manualBkash.available === true;
}