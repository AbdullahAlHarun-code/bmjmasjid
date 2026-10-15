import Link from "next/link";
import { ShareProject } from "@/components/ShareProject";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type ContactPageProps = {
  locale: Locale;
  content: SiteContent;
};

function addressSearchHref(locale: Locale) {
  const query = t(mosqueConfig.address, locale);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ContactPage({ locale, content }: ContactPageProps) {
  const page = content.contact;
  const contact = mosqueConfig.contact;

  return (
    <article>
      <header className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="site-container max-w-3xl py-10 sm:py-12">
          <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
            {page.title}
          </h1>
          <p className="mt-2 text-xl font-medium text-[color:var(--bm-text)]">
            {t(mosqueConfig.name, locale)}
          </p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text-secondary)]">
            {page.intro}
          </p>
        </div>
      </header>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.addressLabel}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-relaxed text-[color:var(--bm-text)]">
          {t(mosqueConfig.address, locale)}
        </p>
        <p className="mt-6">
          <a
            href={addressSearchHref(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center font-semibold text-[color:var(--bm-primary)] underline-offset-4 hover:underline"
          >
            {page.mapSearchLabel}
          </a>
        </p>
        <p className="mt-2 text-sm text-[color:var(--bm-text-secondary)]">
          {page.mapSearchNote}
        </p>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.noticeTitle}
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.noticeBody}
          </p>
          {contact?.phone || contact?.email || contact?.whatsapp ? (
            <ul className="mt-4 space-y-2 text-[color:var(--bm-text)]">
              {contact.phone ? <li>{contact.phone}</li> : null}
              {contact.email ? <li>{contact.email}</li> : null}
              {contact.whatsapp ? <li>{contact.whatsapp}</li> : null}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.linksTitle}
        </h2>
        <ul className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
          <li>
            <Link
              href="/about"
              className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
            >
              <span>{page.linkAbout}</span>
              <span aria-hidden>→</span>
            </Link>
          </li>
          <li>
            <Link
              href="/construction"
              className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
            >
              <span>{page.linkConstruction}</span>
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

        <div className="mt-10">
          <ShareProject copy={page.share} />
        </div>
      </section>
    </article>
  );
}
