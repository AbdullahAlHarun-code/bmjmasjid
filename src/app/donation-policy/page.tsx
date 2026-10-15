import type { Metadata } from "next";
import { Suspense } from "react";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const policy = getContent(locale).donationPolicy;
  return {
    title: policy.title,
    description: policy.description,
  };
}

async function DonationPolicyContent() {
  const locale = await getLocale();
  const policy = getContent(locale).donationPolicy;
  return (
    <PolicyPage
      content={policy}
      links={[
        { href: "/transparency", label: policy.linkTransparency },
        { href: "/support", label: policy.linkSupport },
      ]}
    />
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-12" aria-hidden>
          <div className="h-8 w-40 rounded bg-[color:var(--bm-primary)]/10" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-[color:var(--bm-border)]" />
        </div>
      }
    >
      <DonationPolicyContent />
    </Suspense>
  );
}
