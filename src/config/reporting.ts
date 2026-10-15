import type { LocalizedString } from "@/config/mosque";

/**
 * Editable typed structure for future campaign financial reporting.
 * Keep figures null until verified. Do not invent public records.
 * Unknown must never be shown as zero.
 */
export type CampaignReport = {
  id: string;
  title: LocalizedString;
  /** Verified reporting date as YYYY-MM-DD, or null until confirmed. */
  reportingDate: string | null;
  receivedAmountBdt: number | null;
  expenditureAmountBdt: number | null;
  balanceAmountBdt: number | null;
  /** Source or reference note once a record is verified. */
  sourceReference: LocalizedString | null;
  summary: LocalizedString | null;
};

/**
 * Public campaign reports — empty until verified figures exist.
 * Founder-funded prior construction is tracked separately and is not listed here.
 */
export const campaignReports: readonly CampaignReport[] = [];
