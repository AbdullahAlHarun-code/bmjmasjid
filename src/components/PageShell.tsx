import type { Locale } from "@/config/mosque";
import { getContent } from "@/content";

type PageShellProps = {
  title: string;
  summary: string;
  locale: Locale;
};

/** Minimal route shell — detailed inner pages come in Step 3. */
export function PageShell({ title, summary, locale }: PageShellProps) {
  const content = getContent(locale);

  return (
    <article className="site-container max-w-3xl py-10 sm:py-12">
      <h1 className="text-3xl font-semibold text-[color:var(--bm-primary)]">
        {title}
      </h1>
      <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
        {summary}
      </p>
      <p className="mt-6 rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] p-4 text-sm text-[color:var(--bm-text-secondary)] shadow-[var(--bm-shadow)]">
        {content.shell.stepPlaceholder}
      </p>
    </article>
  );
}
