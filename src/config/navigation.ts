export type NavItem = {
  href: string;
  label: {
    bn: string;
    en: string;
  };
};

/** Primary site navigation — shared by header and footer. */
export const primaryNav: NavItem[] = [
  { href: "/", label: { bn: "হোম", en: "Home" } },
  { href: "/about", label: { bn: "পরিচিতি", en: "About" } },
  { href: "/construction", label: { bn: "নির্মাণ", en: "Construction" } },
  { href: "/support", label: { bn: "সহায়তা", en: "Support" } },
  { href: "/updates", label: { bn: "আপডেট", en: "Updates" } },
  { href: "/transparency", label: { bn: "স্বচ্ছতা", en: "Transparency" } },
  { href: "/contact", label: { bn: "যোগাযোগ", en: "Contact" } },
];

export const legalNav: NavItem[] = [
  { href: "/privacy", label: { bn: "গোপনীয়তা", en: "Privacy" } },
  {
    href: "/donation-policy",
    label: { bn: "দান নীতি", en: "Donation policy" },
  },
];
