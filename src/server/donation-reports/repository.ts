import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { mosqueConfig } from "@/config/mosque";
import { query, withTransaction } from "@/server/db/pool";
import type {
  DonationReportRow,
  DonationReportStatus,
  ValidatedDonationReport,
} from "./types";

function opaquePublicRef(): string {
  return `DR-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function findByIdempotencyKey(
  key: string,
): Promise<DonationReportRow | null> {
  const result = await query<DonationReportRow>(
    `SELECT * FROM donation_report_submissions WHERE idempotency_key = $1 LIMIT 1`,
    [key],
  );
  return result.rows[0] ?? null;
}

async function trxAlreadyClaimed(
  client: PoolClient,
  trxIdNormalized: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1
       FROM donation_report_submissions
      WHERE trx_id_normalized = $1
        AND status IN ('pending_review', 'verified', 'duplicate_claim')
      LIMIT 1`,
    [trxIdNormalized],
  );
  return (result.rowCount ?? 0) > 0;
}

export type InsertResult = {
  row: DonationReportRow;
  created: boolean;
};

export async function insertDonationReport(params: {
  validated: ValidatedDonationReport;
  idempotencyKey: string;
}): Promise<InsertResult> {
  const existing = await findByIdempotencyKey(params.idempotencyKey);
  if (existing) {
    return { row: existing, created: false };
  }

  return withTransaction(async (client) => {
    const again = await client.query<DonationReportRow>(
      `SELECT * FROM donation_report_submissions WHERE idempotency_key = $1 LIMIT 1`,
      [params.idempotencyKey],
    );
    if (again.rows[0]) {
      return { row: again.rows[0], created: false };
    }

    const duplicate = await trxAlreadyClaimed(
      client,
      params.validated.trxIdNormalized,
    );
    const status: DonationReportStatus = duplicate
      ? "duplicate_claim"
      : "pending_review";

    const inserted = await client.query<DonationReportRow>(
      `INSERT INTO donation_report_submissions (
         public_ref,
         provider,
         recipient_number_digits,
         claimed_amount_poisha,
         trx_id_raw,
         trx_id_normalized,
         transfer_date,
         donor_name,
         sending_number,
         reply_contact,
         message,
         status,
         duplicate_trx_flag,
         idempotency_key
       ) VALUES (
         $1, 'bkash', $2, $3, $4, $5, $6::date, $7, $8, $9, $10, $11, $12, $13
       )
       RETURNING *`,
      [
        opaquePublicRef(),
        mosqueConfig.manualBkash.numberDigits,
        params.validated.claimedAmountPoisha,
        params.validated.trxIdRaw,
        params.validated.trxIdNormalized,
        params.validated.transferDate,
        params.validated.donorName,
        params.validated.sendingNumber,
        params.validated.replyContact,
        params.validated.message,
        status,
        duplicate,
        params.idempotencyKey,
      ],
    );

    return { row: inserted.rows[0], created: true };
  });
}

/** Verified totals only — pending and duplicate claims are excluded. */
export async function sumVerifiedReceivedPoisha(): Promise<number | null> {
  const result = await query<{ total: string | null }>(
    `SELECT COALESCE(SUM(verified_amount_poisha), 0)::text AS total
       FROM donation_report_submissions
      WHERE status = 'verified'
        AND verified_amount_poisha IS NOT NULL`,
  );
  const total = Number.parseInt(result.rows[0]?.total ?? "0", 10);
  if (!Number.isFinite(total)) return null;
  return total;
}
