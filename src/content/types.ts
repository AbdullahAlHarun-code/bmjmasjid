export type PageCopy = {
  title: string;
  summary: string;
};

export type SiteContent = {
  home: PageCopy & {
    headline: string;
    ctaSupport: string;
    ctaAbout: string;
  };
  about: PageCopy;
  construction: PageCopy;
  support: PageCopy;
  updates: PageCopy;
  transparency: PageCopy;
  contact: PageCopy;
  privacy: PageCopy;
  donationPolicy: PageCopy;
  shell: {
    footerNote: string;
    stepPlaceholder: string;
  };
};
