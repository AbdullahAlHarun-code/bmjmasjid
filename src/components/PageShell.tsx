import { getContent } from "@/content";
import { mosqueConfig } from "@/config/mosque";

type PageShellProps = {
  title: string;
  summary: string;
};

const content = getContent(mosqueConfig.defaultLocale);

/** Minimal route shell — final page designs come in later steps. */
export function PageShell({ title, summary }: PageShellProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--color-primary)]">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--color-text)]">
        {summary}
      </p>
      <p className="mt-6 text-sm text-[color:var(--color-text-secondary)]">
        {content.shell.stepPlaceholder}
      </p>
    </article>
  );
}
