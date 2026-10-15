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
  /** CSS object-position hint so crops keep the main subject. */
  objectPosition?: string;
  /** Display-only crop for the compact mosque symbol. */
  markViewBox?: string;
};

/**
 * Central mapping of project photos and logo.
 * Captions describe visible content only — filenames are not treated as dates.
 */
export const projectAssets = {
  logo: {
    id: "logo",
    // Crop only the circular mosque symbol for compact navigation and favicon.
    markViewBox: "112 134 257 257",
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
      bn: "বাইতুল মামুর জামে মসজিদের বাইরের দৃশ্য — খিলানযুক্ত জানালা ও পাশের টাওয়ার",
      en: "Exterior of Baitul Mamur Jame Masjid — arched windows and side tower",
    },
    caption: {
      bn: "উন্মুক্ত ইটের কাজ, খিলানযুক্ত জানালার গ্রিল এবং পাশের টাওয়ারসহ মসজিদের বাইরের রূপ।",
      en: "Exterior with exposed brickwork, arched window grilles, and the side tower.",
    },
    original: "collections/3e3cba6d-f9fd-4992-b21a-49c638600d19.jpg",
    objectPosition: "50% 40%",
  },
  constructionStreet: {
    id: "construction-street",
    src: "/images/construction-street.webp",
    width: 1280,
    height: 961,
    alt: {
      bn: "রাস্তার দিক থেকে দেখা অসমাপ্ত উপরতলা ও ফ্যাকাশে হলুদ নিচতলার সামনের অংশ",
      en: "Street view showing unfinished upper floor and pale-yellow lower frontage",
    },
    caption: {
      bn: "নিচতলার সামনের অংশ ফ্যাকাশে হলুদ; উপরতলায় উন্মুক্ত ইট ও কংক্রিটের কাঠামো দৃশ্যমান।",
      en: "The lower frontage is pale yellow; the upper floor still shows exposed brick and concrete.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 18.02.17.jpeg",
    objectPosition: "50% 42%",
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
    objectPosition: "50% 45%",
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
      bn: "উপরতলার খিলান ও জানালার গ্রিল বসানো হয়েছে; দেয়ালে এখনো প্লাস্টার নেই।",
      en: "Arched openings and window grilles are in place; walls are not yet plastered.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 04.36.25 (1).jpeg",
    objectPosition: "50% 35%",
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
      bn: "নকশাকৃত ধাতব গেট বসানো হয়েছে; আশপাশের দেয়াল এখনো অসমাপ্ত।",
      en: "An ornate metal gate is installed; surrounding wall finishing remains incomplete.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 18.02.16.jpeg",
    objectPosition: "50% 50%",
  },
  streetFrontage: {
    id: "street-frontage",
    src: "/images/street-frontage.webp",
    width: 1280,
    height: 960,
    alt: {
      bn: "ফ্যাকাশে হলুদ নিচতলা, নীল শাটার ও উপরতলার খিলানযুক্ত জানালাসহ রাস্তার দৃশ্য",
      en: "Street view with pale-yellow lower frontage, blue shutters, and upper arched windows",
    },
    caption: {
      bn: "নিচতলার সামনের অংশ ফ্যাকাশে হলুদ ও নীল শাটারযুক্ত; উপরতলায় উন্মুক্ত ইট ও খিলানযুক্ত গ্রিল দেখা যায়।",
      en: "Pale-yellow lower frontage with blue shutters; the upper floor shows exposed brick and arched grilles.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 04.36.25 (2).jpeg",
    objectPosition: "50% 45%",
  },
  exteriorSide: {
    id: "exterior-side",
    src: "/images/exterior-side.webp",
    width: 1280,
    height: 960,
    alt: {
      bn: "মসজিদের পাশের বাইরের দৃশ্য — উন্মুক্ত ইট, খিলানযুক্ত জানালা ও টাওয়ার",
      en: "Side exterior of the mosque — exposed brick, arched windows, and tower",
    },
    caption: {
      bn: "পাশ থেকে দেখা উন্মুক্ত ইটের দেয়াল, খিলানযুক্ত জানালার গ্রিল এবং উঁচু টাওয়ার অংশ।",
      en: "Side view of exposed brick walls, arched window grilles, and the taller tower section.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 04.36.26 (1).jpeg",
    objectPosition: "48% 40%",
  },
  entranceAlcove: {
    id: "entrance-alcove",
    src: "/images/entrance-alcove.webp",
    width: 1280,
    height: 960,
    alt: {
      bn: "উন্মুক্ত ইট ও কংক্রিটের প্রবেশপথের কাছাকাছি দৃশ্য",
      en: "Close view of an unfinished brick and concrete entrance alcove",
    },
    caption: {
      bn: "প্রবেশপথের খোলা অংশে উন্মুক্ত ইট, কংক্রিটের বিম এবং অসমাপ্ত মেঝে দৃশ্যমান।",
      en: "The open entrance shows exposed brick, concrete beams, and an unfinished floor.",
    },
    original: "collections/WhatsApp Image 2026-10-14 at 04.36.26.jpeg",
    objectPosition: "50% 45%",
  },
} as const satisfies Record<string, ProjectAsset>;

export type ProjectAssetId = keyof typeof projectAssets;

export const homepagePreviewPhotos = [
  projectAssets.previewEntrance,
  projectAssets.previewArches,
  projectAssets.previewGate,
] as const;

/** Photos shown on the Construction page alongside the introduction. */
export const constructionPagePhotos = [
  projectAssets.constructionStreet,
  projectAssets.previewArches,
  projectAssets.streetFrontage,
  projectAssets.entranceAlcove,
] as const;

/**
 * Gallery photographs for /updates.
 * Separate from dated construction updates — filenames are not capture dates.
 */
export const galleryPhotos = [
  projectAssets.heroExterior,
  projectAssets.constructionStreet,
  projectAssets.previewEntrance,
  projectAssets.previewArches,
  projectAssets.previewGate,
  projectAssets.streetFrontage,
  projectAssets.exteriorSide,
  projectAssets.entranceAlcove,
] as const;
