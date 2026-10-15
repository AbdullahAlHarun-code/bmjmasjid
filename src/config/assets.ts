import type { LocalizedString } from "@/config/mosque";

export type ProjectAsset = {
  id: string;
  /** Optimized web path under /public. Originals remain in collections/. */
  src: string;
  width: number;
  height: number;
  alt: LocalizedString;
  caption: LocalizedString;
  /** Original filename in collections/ for traceability. */
  original: string;
};

/**
 * Central mapping of project photos and logo.
 * Captions describe visible content only — filenames are not treated as dates.
 */
export const projectAssets = {
  logo: {
    id: "logo",
    src: "/images/logo.webp",
    width: 480,
    height: 640,
    alt: {
      bn: "বাইতুল মামুর জামে মসজিদের লোগো",
      en: "Baitul Mamur Jame Masjid logo",
    },
    caption: {
      bn: "বাইতুল মামুর জামে মসজিদের আনুষ্ঠানিক লোগো",
      en: "Official logo of Baitul Mamur Jame Masjid",
    },
    original: "collections/logo.jpg",
  },
  heroExterior: {
    id: "hero-exterior",
    src: "/images/hero-exterior.webp",
    width: 1280,
    height: 957,
    alt: {
      bn: "নির্মাণাধীন বাইতুল মামুর জামে মসজিদের বাইরের দৃশ্য — খিলানযুক্ত জানালা ও টাওয়ার",
      en: "Exterior of Baitul Mamur Jame Masjid under construction — arched windows and tower",
    },
    caption: {
      bn: "উন্মুক্ত ইটের কাজ, খিলানযুক্ত জানালার গ্রিল এবং পাশের টাওয়ারসহ মসজিদের বর্তমান বাইরের রূপ।",
      en: "Current exterior with exposed brickwork, arched window grilles, and the side tower.",
    },
    original: "collections/3e3cba6d-f9fd-4992-b21a-49c638600d19.jpg",
  },
  constructionStreet: {
    id: "construction-street",
    src: "/images/construction-street.webp",
    width: 1280,
    height: 961,
    alt: {
      bn: "রাস্তার দিক থেকে দেখা অসমাপ্ত উপরতলা ও হলুদ ইটের নিচতলা",
      en: "Street view showing unfinished upper floor and pale yellow ground level",
    },
    caption: {
      bn: "নিচতলার কাজ এগিয়েছে; উপরের তলায় এখনো উন্মুক্ত ইট ও কংক্রিটের কাঠামো দৃশ্যমান।",
      en: "The ground level is further along; the upper floor still shows exposed brick and concrete.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 18.02.17.jpeg",
  },
  previewEntrance: {
    id: "preview-entrance",
    src: "/images/preview-entrance.webp",
    width: 1280,
    height: 957,
    alt: {
      bn: "নীল নকশার প্রবেশদ্বারসহ মসজিদের সামনের দৃশ্য",
      en: "Front view of the mosque with blue patterned entrance doors",
    },
    caption: {
      bn: "সামনের প্রবেশপথ ও উপরতলার খিলানযুক্ত জানালা — বাইরের কাজ এখনো অসমাপ্ত।",
      en: "Front entrance and upper arched windows — exterior finishing is still incomplete.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 18.02.16 (1).jpeg",
  },
  previewArches: {
    id: "preview-arches",
    src: "/images/preview-arches.webp",
    width: 1400,
    height: 1050,
    alt: {
      bn: "উপরতলার খিলানযুক্ত জানালা ও ধাতব গ্রিলের কাছাকাছি দৃশ্য",
      en: "Close view of upper arched windows with metal grilles",
    },
    caption: {
      bn: "উপরতলার খিলান ও জানালার গ্রিল বসানো হয়েছে; দেয়ালে এখনো প্লাস্টার হয়নি।",
      en: "Arched openings and window grilles are in place; walls are not yet plastered.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 04.36.25 (1).jpeg",
  },
  previewGate: {
    id: "preview-gate",
    src: "/images/preview-gate.webp",
    width: 1280,
    height: 957,
    alt: {
      bn: "মসজিদে স্থাপিত নকশাকৃত ধাতব গেট",
      en: "Ornate metal gate installed at the mosque",
    },
    caption: {
      bn: "নকশাকৃত ধাতব গেট বসানো হয়েছে; আশপাশের দেয়ালের কাজ এখনো চলমান।",
      en: "An ornate metal gate is installed; surrounding wall finishing is still underway.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 18.02.16.jpeg",
  },
} as const satisfies Record<string, ProjectAsset>;

export const homepagePreviewPhotos = [
  projectAssets.previewEntrance,
  projectAssets.previewArches,
  projectAssets.previewGate,
] as const;
