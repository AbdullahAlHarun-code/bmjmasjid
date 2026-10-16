import { galleryPhotos } from "@/config/assets";
import { constructionUpdates } from "@/config/updates";
import { t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";
import { PhotoGallery } from "@/components/updates/PhotoGallery";

type UpdatesPageProps = {
  locale: Locale;
  content: SiteContent;
};

function formatVerifiedDate(isoDate: string, locale: Locale) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function UpdatesPage({ locale, content }: UpdatesPageProps) {
  const page = content.updates;

  return (
    <article>
      <header className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="site-container max-w-3xl py-10 sm:py-12">
          <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
            {page.title}
          </h1>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text-secondary)]">
            {page.galleryIntro}
          </p>
        </div>
      </header>

      <section className="site-container py-10 sm:py-12" aria-labelledby="gallery-heading">
        <h2
          id="gallery-heading"
          className="text-2xl font-semibold text-[color:var(--bm-primary)]"
        >
          {page.galleryTitle}
        </h2>
        <PhotoGallery
          locale={locale}
          photos={galleryPhotos}
          copy={page}
          photoDates={content.photoDates}
        />
      </section>

      <section
        className="bg-[color:var(--bm-surface)] py-10 sm:py-12"
        aria-labelledby="updates-heading"
      >
        <div className="site-container max-w-3xl">
          <h2
            id="updates-heading"
            className="text-2xl font-semibold text-[color:var(--bm-primary)]"
          >
            {page.updatesTitle}
          </h2>

          {constructionUpdates.length === 0 ? (
            <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
              {page.updatesEmpty}
            </p>
          ) : (
            <ul className="mt-6 space-y-6">
              {constructionUpdates.map((update) => (
                <li
                  key={update.id}
                  className="rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] p-5 shadow-[var(--bm-shadow)]"
                >
                  <h3 className="text-xl font-semibold text-[color:var(--bm-primary)]">
                    {t(update.title, locale)}
                  </h3>
                  {update.verifiedDate ? (
                    <p className="mt-2 text-sm font-medium text-[color:var(--bm-text-secondary)]">
                      <time dateTime={update.verifiedDate}>
                        {formatVerifiedDate(update.verifiedDate, locale)}
                      </time>
                    </p>
                  ) : null}
                  <p className="mt-3 leading-relaxed text-[color:var(--bm-text)]">
                    {t(update.body, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </article>
  );
}
