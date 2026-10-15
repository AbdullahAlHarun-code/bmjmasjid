import type { Metadata } from "next";
import { Suspense } from "react";
import { ConstructionPage } from "@/components/construction/ConstructionPage";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const construction = getContent(locale).construction;
  return {
    title: construction.title,
    description: construction.description,
  };
}

async function ConstructionContent() {
  const locale = await getLocale();
  const content = getContent(locale);
  return <ConstructionPage locale={locale} content={content} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-12" aria-hidden>
          <div className="h-8 w-56 rounded bg-[color:var(--bm-primary)]/10" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-[color:var(--bm-border)]" />
        </div>
      }
    >
      <ConstructionContent />
    </Suspense>
  );
}
