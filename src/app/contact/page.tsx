import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { mosqueConfig } from "@/config/mosque";
import { getContent } from "@/content";

const content = getContent(mosqueConfig.defaultLocale);

export const metadata: Metadata = {
  title: content.contact.title,
};

export default function ContactPage() {
  return (
    <PageShell title={content.contact.title} summary={content.contact.summary} />
  );
}
