import Image from "next/image";
import Link from "next/link";
import {
  homepagePreviewPhotos,
  projectAssets,
} from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SiteContent } from "@/content";

type HomePageProps = {
  locale: Locale;
  content: SiteContent;
};

export function HomePage({ locale, content }: HomePageProps) {
  const home = content.home;
  const hero = projectAssets.heroExterior;
  const construction = projectAssets.constructionStreet;

  return (
    <div>
      {/* A. Hero */}
      <section className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          <div className="relative min-h-[14rem] overflow-hidden sm:min-h-[18rem] lg:min-h-[28rem] lg:order-2">
            <Image
              src={hero.src}
              alt={t(hero.alt, locale)}
              width={hero.width}
              height={hero.height}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-[color:var(--bm-background)] px-4 py-8 sm:px-6 sm:py-10 lg:order-1 lg:px-10 lg:py-14">
            <div className="mx-auto w-full max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-[color:var(--bm-primary)]">
                {home.locationLine}
              </p>
              <h1 className="mt-3 text-balance text-2xl font-semibold leading-snug text-[color:var(--bm-text)] sm:text-3xl lg:text-[2.1rem]">
                {home.heroHeading}
              </h1>
              <p className="mt-4 text-[1.05rem] leading-[1.75] text-[color:var(--bm-text-secondary)] sm:text-[1.125rem]">
                {home.heroSupport}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/support" className="btn btn-primary">
                  {home.ctaSupport}
                </Link>
                <Link href="/construction" className="btn btn-secondary">
                  {home.ctaConstruction}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. Campaign goal */}
      <section className="site-container py-12 sm:py-14">
        <div className="surface-card mx-auto max-w-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {home.campaign.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-[color:var(--bm-text-secondary)]">
            {home.campaign.targetLabel}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--bm-text)] sm:text-5xl">
            {t(mosqueConfig.campaign.targetDisplay, locale)}
          </p>
          <p className="mt-4 text-[color:var(--bm-text-secondary)]">
            {home.campaign.clarification}
          </p>
          <p className="mt-3 border-t border-[color:var(--bm-border)] pt-3 text-sm text-[color:var(--bm-text-secondary)]">
            {home.campaign.receivedUnknown}
          </p>
        </div>
      </section>

      {/* C. Founder story */}
      <section className="bg-[color:var(--bm-surface)] py-12 sm:py-14">
        <div className="site-container max-w-3xl">
          <p className="text-sm font-semibold text-[color:var(--bm-accent-text)]">
            <span className="inline-block rounded-full bg-[color:var(--bm-accent)] px-3 py-1">
              {home.founder.roleLabel}
            </span>
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-[color:var(--bm-primary)]">
            {t(mosqueConfig.founderAndLandDonor, locale)}
          </h2>
          <p className="mt-4 text-[color:var(--bm-text)]">{home.founder.body}</p>
          <Link
            href="/about"
            className="mt-5 inline-flex min-h-12 items-center font-semibold text-[color:var(--bm-primary)] underline-offset-4 hover:underline"
          >
            {home.founder.linkLabel}
          </Link>
        </div>
      </section>

      {/* D. Current construction */}
      <section className="site-container py-12 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] shadow-[var(--bm-shadow)]">
            <Image
              src={construction.src}
              alt={t(construction.alt, locale)}
              width={construction.width}
              height={construction.height}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
              {home.construction.title}
            </h2>
            <p className="mt-4 text-[color:var(--bm-text)]">{home.construction.body}</p>
            <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
              {t(construction.caption, locale)}
            </p>
            <Link href="/construction" className="btn btn-secondary mt-6">
              {home.construction.linkLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* E. Photo preview */}
      <section className="bg-[color:var(--bm-surface)] py-12 sm:py-14">
        <div className="site-container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
              {home.photos.title}
            </h2>
            <p className="mt-3 text-[color:var(--bm-text-secondary)]">
              {home.photos.intro}
            </p>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homepagePreviewPhotos.map((photo) => (
              <li key={photo.id} className="overflow-hidden rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] shadow-[var(--bm-shadow)]">
                <Image
                  src={photo.src}
                  alt={t(photo.alt, locale)}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="aspect-[4/3] h-auto w-full object-cover"
                  loading="lazy"
                />
                <p className="p-4 text-sm leading-relaxed text-[color:var(--bm-text-secondary)]">
                  {t(photo.caption, locale)}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/updates"
            className="mt-8 inline-flex min-h-12 items-center font-semibold text-[color:var(--bm-primary)] underline-offset-4 hover:underline"
          >
            {home.photos.linkLabel}
          </Link>
        </div>
      </section>

      {/* F. Supporters */}
      <section className="site-container py-12 sm:py-14">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {home.supporters.title}
          </h2>
          <p className="mt-3 text-[color:var(--bm-text-secondary)]">
            {home.supporters.intro}
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/support"
            className="surface-card block p-6 transition hover:border-[color:var(--bm-primary)]/35 focus-visible:border-[color:var(--bm-primary)]"
          >
            <h3 className="text-xl font-semibold text-[color:var(--bm-primary)]">
              {home.supporters.localTitle}
            </h3>
            <p className="mt-3 text-[color:var(--bm-text-secondary)]">
              {home.supporters.localBody}
            </p>
            <span className="mt-5 inline-flex min-h-12 items-center font-semibold text-[color:var(--bm-text)]">
              {home.supporters.linkLabel}
            </span>
          </Link>
          <Link
            href="/support"
            className="surface-card block p-6 transition hover:border-[color:var(--bm-primary)]/35 focus-visible:border-[color:var(--bm-primary)]"
          >
            <h3 className="text-xl font-semibold text-[color:var(--bm-primary)]">
              {home.supporters.abroadTitle}
            </h3>
            <p className="mt-3 text-[color:var(--bm-text-secondary)]">
              {home.supporters.abroadBody}
            </p>
            <span className="mt-5 inline-flex min-h-12 items-center font-semibold text-[color:var(--bm-text)]">
              {home.supporters.linkLabel}
            </span>
          </Link>
        </div>
      </section>

      {/* G. Project information */}
      <section className="bg-[color:var(--bm-surface)] py-12 sm:py-14">
        <div className="site-container max-w-3xl">
          <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
            {home.projectInfo.title}
          </h2>
          <p className="mt-3 text-[color:var(--bm-text-secondary)]">
            {home.projectInfo.intro}
          </p>
          <ul className="mt-6 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
            <li>
              <Link
                href="/construction"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{home.projectInfo.construction}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/transparency"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{home.projectInfo.transparency}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
              >
                <span>{home.projectInfo.contact}</span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* H. Final invitation */}
      <section className="site-container py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-[var(--bm-radius)] bg-[color:var(--bm-primary)] px-6 py-10 text-center text-[#F4F7F5] sm:px-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">{home.invite.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-[#D7E2DC]">
            {home.invite.body}
          </p>
          <Link href="/support" className="btn btn-accent mt-7">
            {home.invite.ctaSupport}
          </Link>
        </div>
      </section>
    </div>
  );
}
