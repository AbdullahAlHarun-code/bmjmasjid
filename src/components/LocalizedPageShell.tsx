import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";
import type { SiteContent } from "@/content";

type PageKey = Exclude<keyof SiteContent, "home" | "shell">;

async function LocalizedShell({ page }: { page: PageKey }) {
  const locale = await getLocale();
  const content = getContent(locale)[page];
  return (
    <PageShell locale={locale} title={content.title} summary={content.summary} />
  );
}

export function LocalizedPageShell({ page }: { page: PageKey }) {
  return (
    <Suspense
      fallback={
        <div className="site-container py-12" aria-hidden>
          <div className="h-8 w-48 rounded bg-[color:var(--bm-primary)]/10" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-[color:var(--bm-border)]" />
        </div>
      }
    >
      <LocalizedShell page={page} />
    </Suspense>
  );
}
