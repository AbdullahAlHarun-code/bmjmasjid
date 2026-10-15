import Image from "next/image";
import Link from "next/link";
import { projectAssets } from "@/config/assets";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import { legalNav, primaryNav } from "@/config/navigation";
import type { SiteContent } from "@/content";

type FooterProps = {
  locale: Locale;
  content: SiteContent;
};

export function Footer({ locale, content }: FooterProps) {
  const logo = projectAssets.logo;

  return (
    <footer className="mt-auto bg-[color:var(--bm-primary-deep)] text-[#F4F7F5]">
      <div className="site-container grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-start gap-3">
            <Image
              src={logo.src}
              alt={t(logo.alt, locale)}
              width={48}
              height={64}
              className="h-14 w-auto rounded bg-white p-1"
            />
            <div>
              <p className="text-lg font-semibold leading-snug">
                {t(mosqueConfig.name, locale)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#C9D6CF]">
                {t(mosqueConfig.address, locale)}
              </p>
            </div>
          </div>
        </div>

        <nav aria-label={content.shell.footerNavLabel}>
          <p className="text-sm font-semibold text-[color:var(--bm-accent)]">
            {locale === "bn" ? "দ্রুত লিংক" : "Quick links"}
          </p>
          <ul className="mt-3 space-y-1">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-[#E4EBE7] hover:text-white"
                >
                  {item.label[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={locale === "bn" ? "নীতিমালা" : "Policies"}>
          <p className="text-sm font-semibold text-[color:var(--bm-accent)]">
            {locale === "bn" ? "নীতিমালা" : "Policies"}
          </p>
          <ul className="mt-3 space-y-1">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-[#E4EBE7] hover:text-white"
                >
                  {item.label[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="site-container py-4 text-xs text-[#C9D6CF]">
          {content.shell.footerNote}
        </p>
      </div>
    </footer>
  );
}
