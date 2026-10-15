import type { Metadata } from "next";
import { LocalizedPageShell } from "@/components/LocalizedPageShell";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: getContent(locale).donationPolicy.title };
}

export default function DonationPolicyPage() {
  return <LocalizedPageShell page="donationPolicy" />;
}
