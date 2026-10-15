import type { Metadata } from "next";
import { Suspense } from "react";
import { SupportPage } from "@/components/support/SupportPage";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const support = getContent(locale).support;
  return {
    title: support.title,
    description: support.description,
  };
}

async function SupportContent() {
  const locale = await getLocale();
  const content = getContent(locale);
  return <SupportPage locale={locale} content={content} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-12" aria-hidden>
          <div className="h-8 w-48 rounded bg-[color:var(--bm-primary)]/10" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-[color:var(--bm-border)]" />
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
