import type { LocalizedString } from "@/config/mosque";
import type { ProjectAssetId } from "@/config/assets";

/**
 * Editable typed structure for future dated construction updates.
 * Only add entries when title, verified date, and body are confirmed.
 * Do not invent published updates.
 */
export type ConstructionUpdate = {
  id: string;
  title: LocalizedString;
  /** Verified calendar date as YYYY-MM-DD. Null until confirmed. */
  verifiedDate: string | null;
  body: LocalizedString;
  /** References keys in projectAssets (excluding logo when possible). */
  imageIds: readonly ProjectAssetId[];
};

/**
 * Dated construction updates only.
 * Gallery photographs live in `galleryPhotos` (assets.ts) and are listed separately.
 */
export const constructionUpdates: readonly ConstructionUpdate[] = [];
