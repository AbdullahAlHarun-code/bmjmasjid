import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { mosqueConfig, t } from "@/config/mosque";
import { getContent } from "@/content";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

const locale = mosqueConfig.defaultLocale;
const content = getContent(locale);

export const metadata: Metadata = {
  title: {
    default: t(mosqueConfig.name, locale),
    template: `%s | ${t(mosqueConfig.shortName, locale)}`,
  },
  description: content.home.summary,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={locale} className={`${notoSansBengali.variable} h-full`}>
      <body className={`${notoSansBengali.className} flex min-h-full flex-col antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
