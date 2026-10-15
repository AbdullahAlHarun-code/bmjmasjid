import Image from "next/image";
import Link from "next/link";
import { ShareProject } from "@/components/ShareProject";
import { projectAssets } from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type SupportPageProps = {
  locale: Locale;
  content: SiteContent;
};

export function SupportPage({ locale, content }: SupportPageProps) {
  const page = content.support;
  const photo = projectAssets.previewEntrance;

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
            <p className="text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
              {page.appeal}
            </p>
            <div className="surface-card mt-6 p-6">
              <p className="text-sm font-medium text-[color:var(--bm-text-secondary)]">
                {page.targetLabel}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[color:var(--bm-text)]">
                {t(mosqueConfig.campaign.targetDisplay, locale)}
              </p>
              <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
                {page.targetClarification}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.statusTitle}
          </h2>
          <p className="mt-4 rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] p-5 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.statusBody}
          </p>
        </div>
      </section>

      <section className="site-container py-10 sm:py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-[color:var(--bm-primary)]">
              {page.localTitle}
            </h2>
            <p className="mt-3 text-[color:var(--bm-text-secondary)]">{page.localBody}</p>
          </div>
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-[color:var(--bm-primary)]">
              {page.abroadTitle}
            </h2>
            <p className="mt-3 text-[color:var(--bm-text-secondary)]">{page.abroadBody}</p>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.actionsTitle}
          </h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/construction" className="btn btn-secondary">
              {page.linkConstruction}
            </Link>
            <Link href="/updates" className="btn btn-secondary">
              {page.linkPhotos}
            </Link>
          </div>
          <div className="mt-10">
            <ShareProject copy={page.share} />
          </div>
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.faqTitle}
        </h2>
        <dl className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
          {page.faqs.map((faq) => (
            <div key={faq.question} className="py-5">
              <dt className="text-lg font-semibold text-[color:var(--bm-text)]">
                {faq.question}
              </dt>
              <dd className="mt-2 text-[color:var(--bm-text-secondary)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
