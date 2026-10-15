import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { DocumentLang } from "@/components/DocumentLang";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileSupportBar } from "@/components/MobileSupportBar";
import { mosqueConfig, t } from "@/config/mosque";
import { getContent } from "@/content";
import { getLocale } from "@/lib/get-locale";
import "./globals.css";

/**
 * Locale is read from a cookie for Bangla/English switching.
 * Opt this shared shell out of instant-prerender validation.
 */
export const instant = false;

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = getContent(locale);

  return {
    title: {
      default: t(mosqueConfig.name, locale),
      template: `%s | ${t(mosqueConfig.shortName, locale)}`,
    },
    description: content.home.heroSupport,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const content = getContent(locale);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${notoSansBengali.variable} h-full`}
    >
      <body className={`${notoSansBengali.className} flex min-h-full flex-col antialiased`}>
        <DocumentLang locale={locale} />
        <a href="#main-content" className="skip-link">
          {content.shell.skipToContent}
        </a>
        <Header locale={locale} content={content} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} content={content} />
        <MobileSupportBar content={content} />
      </body>
    </html>
  );
}
