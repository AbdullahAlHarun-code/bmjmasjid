import Image from "next/image";
import Link from "next/link";
import { projectAssets } from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type AboutPageProps = {
  locale: Locale;
  content: SiteContent;
};

export function AboutPage({ locale, content }: AboutPageProps) {
  const about = content.about;
  const photo = projectAssets.heroExterior;

  return (
    <article>
      <header className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="site-container max-w-3xl py-10 sm:py-12">
          <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
            {about.title}
          </h1>
          <p className="mt-2 text-xl font-medium text-[color:var(--bm-text)]">
            {t(mosqueConfig.name, locale)}
          </p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text-secondary)]">
            {about.intro}
          </p>
        </div>
      </header>

      <section className="site-container py-10 sm:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] shadow-[var(--bm-shadow)]">
            <Image
              src={photo.src}
              alt={t(photo.alt, locale)}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full object-cover"
              style={{ objectPosition: photo.objectPosition }}
              priority
            />
            <p className="p-4 text-sm leading-relaxed text-[color:var(--bm-text-secondary)]">
              {t(photo.caption, locale)}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[color:var(--bm-primary)]">
              {about.addressLabel}
            </h2>
            <p className="mt-3 text-[1.125rem] leading-relaxed text-[color:var(--bm-text)]">
              {t(mosqueConfig.address, locale)}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {about.founderTitle}
          </h2>
          <p className="mt-3 text-xl font-medium text-[color:var(--bm-text)]">
            {t(mosqueConfig.founderAndLandDonor, locale)}
          </p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {about.founderBody}
          </p>
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {about.campaignTitle}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {about.campaignBody}
        </p>
        <div className="surface-card mt-6 p-6">
          <p className="text-sm font-medium text-[color:var(--bm-text-secondary)]">
            {about.targetLabel}
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-[color:var(--bm-text)]">
            {t(mosqueConfig.campaign.targetDisplay, locale)}
          </p>
          <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
            {about.targetClarification}
          </p>
        </div>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {about.linksTitle}
          </h2>
          <ul className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
            <li>
              <Link
                href="/construction"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{about.linkConstruction}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/updates"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{about.linkPhotos}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/support"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{about.linkSupport}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
