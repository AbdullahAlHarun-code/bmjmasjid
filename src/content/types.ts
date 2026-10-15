export type PageCopy = {
  title: string;
  summary: string;
};

export type HomeContent = {
  title: string;
  locationLine: string;
  heroHeading: string;
  /** Shorter support line for small screens. */
  heroSupportMobile: string;
  /** Fuller hero support line from `sm` breakpoint up. */
  heroSupport: string;
  ctaSupport: string;
  ctaConstruction: string;
  campaign: {
    title: string;
    targetLabel: string;
    clarification: string;
    receivedUnknown: string;
  };
  founder: {
    title: string;
    roleLabel: string;
    body: string;
    linkLabel: string;
  };
  construction: {
    title: string;
    body: string;
    linkLabel: string;
  };
  photos: {
    title: string;
    intro: string;
    linkLabel: string;
  };
  supporters: {
    title: string;
    intro: string;
    localTitle: string;
    localBody: string;
    abroadTitle: string;
    abroadBody: string;
    linkLabel: string;
  };
  projectInfo: {
    title: string;
    intro: string;
    construction: string;
    transparency: string;
    contact: string;
  };
  invite: {
    title: string;
    body: string;
    ctaSupport: string;
  };
};

export type AboutContent = {
  title: string;
  description: string;
  intro: string;
  addressLabel: string;
  founderTitle: string;
  founderBody: string;
  campaignTitle: string;
  campaignBody: string;
  targetLabel: string;
  targetClarification: string;
  linksTitle: string;
  linkConstruction: string;
  linkPhotos: string;
  linkSupport: string;
};

export type ConstructionContent = {
  title: string;
  description: string;
  intro: string;
  visibleTitle: string;
  visibleBody: string;
  nextWorkTitle: string;
  nextWorkBody: string;
  campaignTitle: string;
  campaignBody: string;
  targetClarification: string;
  linksTitle: string;
  linkUpdates: string;
  linkTransparency: string;
  linkSupport: string;
};

export type UpdatesContent = {
  title: string;
  description: string;
  galleryTitle: string;
  galleryIntro: string;
  openImage: string;
  updatesTitle: string;
  updatesEmpty: string;
  viewer: {
    dialogLabel: string;
    close: string;
    previous: string;
    next: string;
    /** Pattern with `{current}` and `{total}` placeholders. */
    position: string;
  };
};

export type ShellContent = {
  footerNote: string;
  stepPlaceholder: string;
  ctaSupport: string;
  languageLabel: string;
  languageBn: string;
  languageEn: string;
  menuOpen: string;
  menuClose: string;
  primaryNavLabel: string;
  footerNavLabel: string;
  mobileSupportLabel: string;
  skipToContent: string;
};

export type SiteContent = {
  home: HomeContent;
  about: AboutContent;
  construction: ConstructionContent;
  support: PageCopy;
  updates: UpdatesContent;
  transparency: PageCopy;
  contact: PageCopy;
  privacy: PageCopy;
  donationPolicy: PageCopy;
  shell: ShellContent;
};
