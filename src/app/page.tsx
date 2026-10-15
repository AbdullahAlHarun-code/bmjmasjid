import Link from "next/link";
import { mosqueConfig, t } from "@/config/mosque";
import { getContent } from "@/content";

const locale = mosqueConfig.defaultLocale;
const content = getContent(locale);

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-[color:var(--color-accent)]">
        {t(mosqueConfig.location.upazila, locale)},{" "}
        {t(mosqueConfig.location.district, locale)}
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-[color:var(--color-primary)] sm:text-4xl">
        {t(mosqueConfig.name, locale)}
      </h1>
      <p className="mt-4 text-lg text-[color:var(--color-text)]">
        {content.home.headline}
      </p>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--color-text-secondary)]">
        {content.home.summary}
      </p>
      <p className="mt-6 text-sm text-[color:var(--color-text-secondary)]">
        {t(mosqueConfig.audienceNote, locale)}
      </p>
      <dl className="mt-8 space-y-3 text-sm">
        <div>
          <dt className="text-[color:var(--color-text-secondary)]">
            {locale === "bn" ? "লক্ষ্যমাত্রা" : "Campaign target"}
          </dt>
          <dd className="text-xl font-semibold text-[color:var(--color-primary)]">
            {t(mosqueConfig.campaign.targetDisplay, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-[color:var(--color-text-secondary)]">
            {locale === "bn" ? "প্রতিষ্ঠাতা ও জমি দাতা" : "Founder and land donor"}
          </dt>
          <dd className="text-[color:var(--color-text)]">
            {t(mosqueConfig.founderAndLandDonor, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-[color:var(--color-text-secondary)]">
            {locale === "bn" ? "ঠিকানা" : "Address"}
          </dt>
          <dd className="text-[color:var(--color-text)]">
            {t(mosqueConfig.address, locale)}
          </dd>
        </div>
      </dl>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {content.home.ctaSupport}
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center justify-center rounded border border-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/5"
        >
          {content.home.ctaAbout}
        </Link>
      </div>
      <p className="mt-10 text-xs text-[color:var(--color-text-secondary)]">
        {content.shell.stepPlaceholder}
      </p>
    </div>
  );
}
