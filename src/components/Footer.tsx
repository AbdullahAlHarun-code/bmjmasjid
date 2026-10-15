import Link from "next/link";
import { mosqueConfig, t } from "@/config/mosque";
import { legalNav, primaryNav } from "@/config/navigation";
import { getContent } from "@/content";

const locale = mosqueConfig.defaultLocale;
const content = getContent(locale);

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[color:var(--color-primary)]/15 bg-[color:var(--color-surface)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div>
          <p className="font-semibold text-[color:var(--color-primary)]">
            {t(mosqueConfig.name, locale)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {t(mosqueConfig.address, locale)}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {[...primaryNav, ...legalNav].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
                >
                  {item.label[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-[color:var(--color-text-secondary)]">
          {content.shell.footerNote}
        </p>
      </div>
    </footer>
  );
}
