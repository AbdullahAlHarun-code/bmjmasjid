import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.donationPolicy.title,
};

export default function DonationPolicyPage() {
  return (
    <PageShell
      title={content.donationPolicy.title}
      summary={content.donationPolicy.summary}
    />
  );
}
