import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.transparency.title,
};

export default function TransparencyPage() {
  return (
    <PageShell
      title={content.transparency.title}
      summary={content.transparency.summary}
    />
  );
}
