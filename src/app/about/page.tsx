import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutPage } from "@/components/about/AboutPage";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const about = getContent(locale).about;
  return {
    title: about.title,
    description: about.description,
  };
}

async function AboutContent() {
  const locale = await getLocale();
  const content = getContent(locale);
  return <AboutPage locale={locale} content={content} />;
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
      <AboutContent />
    </Suspense>
  );
}
