import { projectAssets } from "@/config/assets";
import { t, type Locale } from "@/config/mosque";

type BrandMarkProps = { locale: Locale; className?: string };

/** Display-only crop of the supplied logo; original artwork stays unchanged. */
export function BrandMark({ locale, className = "" }: BrandMarkProps) {
  const logo = projectAssets.logo;
  return (
    <svg
      viewBox={logo.markViewBox}
      role="img"
      aria-label={t(logo.alt, locale)}
      focusable="false"
      className={`shrink-0 overflow-hidden rounded-full bg-white ${className}`}
    >
      <image href={logo.src} width={logo.width} height={logo.height} />
    </svg>
  );
}
