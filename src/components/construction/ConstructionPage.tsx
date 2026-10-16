import Image from "next/image";
import Link from "next/link";
import { PhotoMeta } from "@/components/PhotoMeta";
import { constructionPagePhotos } from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type ConstructionPageProps = {
  locale: Locale;
  content: SiteContent;
};

export function ConstructionPage({ locale, content }: ConstructionPageProps) {
  const page = content.construction;

  return (
    <article>
      <header className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="site-container max-w-3xl py-10 sm:py-12">
          <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
            {page.title}
          </h1>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text-secondary)]">
            {page.intro}
          </p>
        </div>
      </header>

      <section className="site-container py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.visibleTitle}
        </h2>
        <p className="mt-4 max-w-3xl text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {page.visibleBody}
        </p>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {constructionPagePhotos.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] shadow-[var(--bm-shadow)]"
            >
              <Image
                src={photo.src}
                alt={t(photo.alt, locale)}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 100vw, 50vw"
                className="aspect-[4/3] h-auto w-full object-cover"
                style={{ objectPosition: photo.objectPosition }}
                loading="lazy"
              />
              <div className="p-4">
                <p className="text-sm leading-relaxed text-[color:var(--bm-text-secondary)]">
                  {t(photo.caption, locale)}
                </p>
                <PhotoMeta
                  asset={photo}
                  locale={locale}
                  labels={content.photoDates}
                  className="mt-2"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.nextWorkTitle}
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.nextWorkBody}
          </p>
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.campaignTitle}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {page.campaignBody}
        </p>
        <div className="surface-card mt-6 p-6">
          <p className="text-4xl font-semibold tracking-tight text-[color:var(--bm-text)]">
            {t(mosqueConfig.campaign.targetDisplay, locale)}
          </p>
          <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
            {page.targetClarification}
          </p>
        </div>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.linksTitle}
          </h2>
          <ul className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
            <li>
              <Link
                href="/updates"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{page.linkUpdates}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/transparency"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{page.linkTransparency}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/support"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{page.linkSupport}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
