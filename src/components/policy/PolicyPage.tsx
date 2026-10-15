import Link from "next/link";
import type { DonationPolicyContent, PrivacyContent } from "@/content";

type PolicySectionPageProps = {
  content: PrivacyContent | DonationPolicyContent;
  links?: Array<{ href: string; label: string }>;
};

export function PolicyPage({ content, links }: PolicySectionPageProps) {
  return (
    <article>
      <header className="border-b border-[color:var(--bm-border)] bg-[color:var(--bm-surface)]">
        <div className="site-container max-w-3xl py-10 sm:py-12">
          <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
            {content.title}
          </h1>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text-secondary)]">
            {content.intro}
          </p>
        </div>
      </header>

      <div className="site-container max-w-3xl py-10 sm:py-12">
        <div className="space-y-10">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-[color:var(--bm-primary)]">
                {section.title}
              </h2>
              <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {links && links.length > 0 ? (
          <ul className="mt-12 divide-y divide-[color:var(--bm-border)] border-y border-[color:var(--bm-border)]">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-14 items-center justify-between gap-3 py-3 font-medium text-[color:var(--bm-text)] hover:text-[color:var(--bm-primary)]"
                >
                  <span>{link.label}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
