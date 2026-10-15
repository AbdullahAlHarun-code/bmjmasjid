import Link from "next/link";
import { campaignReports } from "@/config/reporting";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type TransparencyPageProps = {
  locale: Locale;
  content: SiteContent;
};

function formatReportingDate(isoDate: string, locale: Locale) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function TransparencyPage({ locale, content }: TransparencyPageProps) {
  const page = content.transparency;

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

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.purposeTitle}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {page.purposeBody}
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
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.unknownTitle}
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.unknownBody}
          </p>
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.reportingTitle}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {page.reportingBody}
        </p>
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.founderTitle}
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.founderBody}
          </p>
        </div>
      </section>

      <section className="site-container max-w-3xl py-10 sm:py-12">
        <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
          {page.reportsTitle}
        </h2>
        {campaignReports.length === 0 ? (
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
            {page.reportsEmpty}
          </p>
        ) : (
          <ul className="mt-6 space-y-6">
            {campaignReports.map((report) => (
              <li
                key={report.id}
                className="rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] p-5"
              >
                <h3 className="text-xl font-semibold text-[color:var(--bm-primary)]">
                  {t(report.title, locale)}
                </h3>
                {report.reportingDate ? (
                  <p className="mt-2 text-sm text-[color:var(--bm-text-secondary)]">
                    <time dateTime={report.reportingDate}>
                      {formatReportingDate(report.reportingDate, locale)}
                    </time>
                  </p>
                ) : null}
                {report.summary ? (
                  <p className="mt-3 text-[color:var(--bm-text)]">
                    {t(report.summary, locale)}
                  </p>
                ) : null}
                {report.sourceReference ? (
                  <p className="mt-2 text-sm text-[color:var(--bm-text-secondary)]">
                    {t(report.sourceReference, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-[color:var(--bm-surface)] py-10 sm:py-12">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {page.linksTitle}
          </h2>
          <ul className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
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
                href="/updates"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{page.linkPhotos}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/donation-policy"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{page.linkDonationPolicy}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
