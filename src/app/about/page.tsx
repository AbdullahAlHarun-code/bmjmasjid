import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.about.title,
};

export default function AboutPage() {
  return <PageShell title={content.about.title} summary={content.about.summary} />;
}
