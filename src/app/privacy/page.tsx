import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.privacy.title,
};

export default function PrivacyPage() {
  return (
    <PageShell title={content.privacy.title} summary={content.privacy.summary} />
  );
}
