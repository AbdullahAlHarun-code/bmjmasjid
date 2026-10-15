import { randomBytes, randomUUID } from "node:crypto";
import { mosqueConfig } from "@/config/mosque";
import { query, withTransaction, lockReportKey, type SqlClient } from "@/server/db/pool";
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
    `SELECT * FROM donation_report_submissions WHERE idempotency_key = ? LIMIT 1`,
    [key],
  );
  return result.rows[0] ?? null;
}

async function trxAlreadyClaimed(
  client: SqlClient,
  trxIdNormalized: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1
       FROM donation_report_submissions
      WHERE trx_id_normalized = ?
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

export class RetryConflictError extends Error {}

function checkRetry(row: DonationReportRow, input: ValidatedDonationReport): InsertResult {
  const date = row.transfer_date instanceof Date
    ? [row.transfer_date.getFullYear(), String(row.transfer_date.getMonth() + 1).padStart(2, "0"), String(row.transfer_date.getDate()).padStart(2, "0")].join("-")
    : String(row.transfer_date).slice(0, 10);
  if (String(row.claimed_amount_poisha) !== String(input.claimedAmountPoisha)
    || row.trx_id_normalized !== input.trxIdNormalized || date !== input.transferDate
    || row.donor_name !== input.donorName || row.sending_number !== input.sendingNumber
    || row.reply_contact !== input.replyContact || row.message !== input.message) {
    throw new RetryConflictError("Retry content changed");
  }
  return { row, created: false };
}

export async function insertDonationReport(params: {
  validated: ValidatedDonationReport;
  idempotencyKey: string;
}): Promise<InsertResult> {
  const existing = await findByIdempotencyKey(params.idempotencyKey);
  if (existing) {
    return checkRetry(existing, params.validated);
  }

  return withTransaction(async (client) => {
    // Serialize concurrent retries, then claims for the same transaction.
    await lockReportKey(client, "retry:" + params.idempotencyKey);
    const again = await client.query<DonationReportRow>(
      `SELECT * FROM donation_report_submissions WHERE idempotency_key = ? LIMIT 1`,
      [params.idempotencyKey],
    );
    if (again.rows[0]) {
      return checkRetry(again.rows[0], params.validated);
    }

    await lockReportKey(client, "trx:" + params.validated.trxIdNormalized);

    const duplicate = await trxAlreadyClaimed(
      client,
      params.validated.trxIdNormalized,
    );
    const status: DonationReportStatus = duplicate
      ? "duplicate_claim"
      : "pending_review";

    const publicRef = opaquePublicRef();
    await client.query(
      `INSERT INTO donation_report_submissions (
         id,
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
         ?, ?, 'bkash', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       )`,
      [
        randomUUID(),
        publicRef,
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

    const inserted = await client.query<DonationReportRow>("SELECT * FROM donation_report_submissions WHERE public_ref=?", [publicRef]);
    return { row: inserted.rows[0], created: true };
  });
}

/** Verified totals only — pending and duplicate claims are excluded. */
export async function sumVerifiedReceivedPoisha(): Promise<number | null> {
  const result = await query<{ total: string | null }>(
    `SELECT CAST(COALESCE(SUM(verified_amount_poisha), 0) AS CHAR) AS total
       FROM donation_report_submissions
      WHERE status = 'verified'
        AND verified_amount_poisha IS NOT NULL`,
  );
  const total = Number.parseInt(result.rows[0]?.total ?? "0", 10);
  if (!Number.isSafeInteger(total)) return null;
  return total;
}
