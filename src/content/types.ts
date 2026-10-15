export type PageCopy = {
  title: string;
  summary: string;
};

export type HomeContent = {
  title: string;
  locationLine: string;
  heroHeading: string;
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
  about: PageCopy;
  construction: PageCopy;
  support: PageCopy;
  updates: PageCopy;
  transparency: PageCopy;
  contact: PageCopy;
  privacy: PageCopy;
  donationPolicy: PageCopy;
  shell: ShellContent;
};
