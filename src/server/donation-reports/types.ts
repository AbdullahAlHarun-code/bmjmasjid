export type DonationReportStatus =
  | "pending_review"
  | "verified"
  | "rejected"
  | "duplicate_claim";

export type DonationReportInput = {
  amount: string;
  trxId: string;
  transferDate: string;
  donorName?: string;
  sendingNumber?: string;
  replyContact?: string;
  message?: string;
};

export type ValidatedDonationReport = {
  claimedAmountPoisha: number;
  trxIdRaw: string;
  trxIdNormalized: string;
  transferDate: string;
  donorName: string | null;
  sendingNumber: string | null;
  replyContact: string | null;
  message: string | null;
};

export type DonationReportRow = {
  id: string;
  public_ref: string;
  provider: string;
  recipient_number_digits: string;
  claimed_amount_poisha: string;
  trx_id_raw: string;
  trx_id_normalized: string;
  transfer_date: string | Date;
  donor_name: string | null;
  sending_number: string | null;
  reply_contact: string | null;
  message: string | null;
  status: DonationReportStatus;
  duplicate_trx_flag: boolean | 0 | 1;
  verified_amount_poisha: string | null;
  idempotency_key: string;
  created_at: string;
};

export const FIELD_LIMITS = {
  amountMaxChars: 20,
  trxIdMin: 4,
  trxIdMax: 64,
  donorNameMax: 120,
  sendingNumberMax: 32,
  replyContactMax: 160,
  messageMax: 500,
  /** Soft upper bound for a single claimed transfer (BDT). */
  amountMaxTaka: 10_000_000,
  bodyMaxBytes: 8_192,
} as const;
