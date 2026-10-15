import type { ProjectAsset } from "@/config/assets";
import type { Locale } from "@/config/mosque";
import type { PhotoDateCopy } from "@/content/types";
import { formatPhotoDate } from "@/lib/photo-date";

type PhotoMetaProps = {
  asset: ProjectAsset;
  locale: Locale;
  labels: PhotoDateCopy;
  className?: string;
};

function DateRow({
  label,
  iso,
  formatted,
}: {
  label: string;
  iso: string;
  formatted: string;
}) {
  return (
    <span className="block">
      <span className="font-medium">{label}</span>
      <span aria-hidden="true">: </span>
      <time dateTime={iso}>{formatted}</time>
    </span>
  );
}

/**
 * Renders confirmed photo dates. Returns nothing when both dates are absent or invalid.
 * Uses spans so the block stays valid inside the gallery card button.
 */
export function PhotoMeta({ asset, locale, labels, className }: PhotoMetaProps) {
  const taken = formatPhotoDate(asset.takenAt, locale);
  const verified = formatPhotoDate(asset.lastVerifiedAt, locale);
  if (!taken && !verified) return null;

  const classes = [
    "block space-y-1 text-sm leading-relaxed text-[color:var(--bm-text-secondary)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {taken && asset.takenAt ? (
        <DateRow label={labels.takenLabel} iso={asset.takenAt} formatted={taken} />
      ) : null}
      {verified && asset.lastVerifiedAt ? (
        <DateRow
          label={labels.verifiedLabel}
          iso={asset.lastVerifiedAt}
          formatted={verified}
        />
      ) : null}
    </span>
  );
}
