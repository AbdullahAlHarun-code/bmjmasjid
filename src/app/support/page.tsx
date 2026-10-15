import type { Metadata } from "next";
import { LocalizedPageShell } from "@/components/LocalizedPageShell";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: getContent(locale).support.title };
}

export default function SupportPage() {
  return <LocalizedPageShell page="support" />;
}
