import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.construction.title,
};

export default function ConstructionPage() {
  return (
    <PageShell
      title={content.construction.title}
      summary={content.construction.summary}
    />
  );
}
