export type PageCopy = {
  title: string;
  summary: string;
};

export type FaqItem = {
  question: string;
  answer: string;
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
    bkashTitle: string;
    bkashBody: string;
    bkashLinkLabel: string;
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
  caretakerTitle: string;
  caretakerBody: string;
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

export type ShareContent = {
  title: string;
  intro: string;
  nativeShare: string;
  whatsapp: string;
  copyLink: string;
  copied: string;
  copyError: string;
  /** Short message for WhatsApp / native share; `{url}` placeholder. */
  message: string;
};

export type BkashSupportCopy = {
  heading: string;
  numberLabel: string;
  caretakerLabel: string;
  explanation: string;
  gatewayPending: string;
  verifyBeforeConfirm: string;
  notAutoVerified: string;
  abroadNote: string;
  copyNumber: string;
  copied: string;
  copyError: string;
  internationalLabel: string;
  brandWordmark: string;
  brandNote: string;
};

export type DonationReportCopy = {
  heading: string;
  description: string;
  amountLabel: string;
  amountHint: string;
  trxIdLabel: string;
  trxIdHint: string;
  transferDateLabel: string;
  transferDateHint: string;
  optionalToggle: string;
  optionalIntro: string;
  donorNameLabel: string;
  donorNameHint: string;
  sendingNumberLabel: string;
  sendingNumberHint: string;
  replyContactLabel: string;
  replyContactHint: string;
  messageLabel: string;
  submit: string;
  submitting: string;
  success: string;
  successRefLabel: string;
  retryError: string;
  unavailable: string;
  validationRequired: string;
  validationInvalid: string;
  rateLimited: string;
  whatsappButton: string;
  whatsappExplain: string;
  websiteVsWhatsapp: string;
  transferSeparate: string;
};

export type SupportContent = {
  title: string;
  description: string;
  intro: string;
  appeal: string;
  targetLabel: string;
  targetClarification: string;
  statusTitle: string;
  statusBody: string;
  bkash: BkashSupportCopy;
  report: DonationReportCopy;
  localTitle: string;
  localBody: string;
  abroadTitle: string;
  abroadBody: string;
  actionsTitle: string;
  linkConstruction: string;
  linkPhotos: string;
  faqTitle: string;
  faqs: FaqItem[];
  share: ShareContent;
};

export type TransparencyContent = {
  title: string;
  description: string;
  intro: string;
  purposeTitle: string;
  purposeBody: string;
  targetLabel: string;
  targetClarification: string;
  unknownTitle: string;
  unknownBody: string;
  reportingTitle: string;
  reportingBody: string;
  manualTitle: string;
  manualBody: string;
  founderTitle: string;
  founderBody: string;
  reportsTitle: string;
  reportsEmpty: string;
  linksTitle: string;
  linkConstruction: string;
  linkPhotos: string;
  linkDonationPolicy: string;
};

export type ContactContent = {
  title: string;
  description: string;
  intro: string;
  addressLabel: string;
  caretakerTitle: string;
  caretakerRoleLabel: string;
  bkashLabel: string;
  bkashNote: string;
  noticeTitle: string;
  noticeBody: string;
  mapSearchLabel: string;
  mapSearchNote: string;
  linksTitle: string;
  linkAbout: string;
  linkConstruction: string;
  linkSupport: string;
  share: ShareContent;
};

export type PrivacyContent = {
  title: string;
  description: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
};

export type DonationPolicyContent = {
  title: string;
  description: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  linkTransparency: string;
  linkSupport: string;
};

export type PhotoDateCopy = {
  takenLabel: string;
  verifiedLabel: string;
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
  support: SupportContent;
  updates: UpdatesContent;
  transparency: TransparencyContent;
  contact: ContactContent;
  privacy: PrivacyContent;
  donationPolicy: DonationPolicyContent;
  photoDates: PhotoDateCopy;
  shell: ShellContent;
};
