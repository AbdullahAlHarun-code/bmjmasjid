import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.updates.title,
};

export default function UpdatesPage() {
  return (
    <PageShell title={content.updates.title} summary={content.updates.summary} />
  );
}
