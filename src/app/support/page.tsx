import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.support.title,
};

export default function SupportPage() {
  return (
    <PageShell title={content.support.title} summary={content.support.summary} />
  );
}
