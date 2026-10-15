import Link from "next/link";
import { mosqueConfig, t } from "@/config/mosque";
import { primaryNav } from "@/config/navigation";
import { getContent } from "@/content";

const locale = mosqueConfig.defaultLocale;
const content = getContent(locale);

export function Header() {
  return (
    <header className="border-b border-[color:var(--color-primary)]/15 bg-[color:var(--color-surface)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Link
            href="/"
            className="text-lg font-semibold text-[color:var(--color-primary)] sm:text-xl"
          >
            {t(mosqueConfig.name, locale)}
          </Link>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            {content.shell.footerNote}
          </p>
        </div>
        <nav aria-label="Primary" className="overflow-x-auto">
          <ul className="flex min-w-max gap-1 sm:flex-wrap sm:gap-2">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded px-2 py-1 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-primary)]/8 hover:text-[color:var(--color-primary)]"
                >
                  {item.label[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
