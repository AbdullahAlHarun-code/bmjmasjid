import { Suspense } from "react";
import { HomePage } from "@/components/home/HomePage";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

async function HomeContent() {
  const locale = await getLocale();
  const content = getContent(locale);
  return <HomePage locale={locale} content={content} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-16" aria-hidden>
          <div className="h-8 w-2/3 max-w-md rounded bg-[color:var(--bm-primary)]/10" />
          <div className="mt-4 h-4 w-full max-w-2xl rounded bg-[color:var(--bm-border)]" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
