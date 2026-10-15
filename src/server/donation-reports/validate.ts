import { normalizeDigits, normalizeTrxId, parseAmountToPoisha } from "@/lib/normalize";
import {
  FIELD_LIMITS,
  type DonationReportInput,
  type ValidatedDonationReport,
} from "./types";

export type FieldErrors = Partial<
  Record<
    | "amount"
    | "trxId"
    | "transferDate"
    | "donorName"
    | "sendingNumber"
    | "replyContact"
    | "message"
    | "form",
    string
  >
>;

function trimOrNull(value: string | undefined, max: number): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function validateDonationReport(
  input: DonationReportInput,
): { ok: true; value: ValidatedDonationReport } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const amountRaw = (input.amount ?? "").trim();
  if (!amountRaw) {
    errors.amount = "required";
  } else if (amountRaw.length > FIELD_LIMITS.amountMaxChars) {
    errors.amount = "too_long";
  } else {
    const poisha = parseAmountToPoisha(amountRaw);
    if (poisha == null) {
      errors.amount = "invalid";
    } else if (poisha > FIELD_LIMITS.amountMaxTaka * 100) {
      errors.amount = "too_large";
    }
  }

  const trxRaw = (input.trxId ?? "").trim();
  if (!trxRaw) {
    errors.trxId = "required";
  } else if (trxRaw.length < FIELD_LIMITS.trxIdMin || trxRaw.length > FIELD_LIMITS.trxIdMax) {
    errors.trxId = "invalid_length";
  } else if (!/^[\p{L}\p{N}\-_./]+$/u.test(normalizeDigits(trxRaw).replace(/\s+/g, ""))) {
    errors.trxId = "invalid";
  }

  const dateRaw = (input.transferDate ?? "").trim();
  if (!dateRaw) {
    errors.transferDate = "required";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    errors.transferDate = "invalid";
  } else {
    const transfer = new Date(`${dateRaw}T12:00:00.000Z`);
    if (Number.isNaN(transfer.getTime())) {
      errors.transferDate = "invalid";
    } else {
      const today = new Date();
      const todayUtc = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
      );
      if (transfer.getTime() > todayUtc.getTime()) {
        errors.transferDate = "future";
      }
      const earliest = Date.UTC(2020, 0, 1);
      if (transfer.getTime() < earliest) {
        errors.transferDate = "too_old";
      }
    }
  }

  if ((input.donorName ?? "").length > FIELD_LIMITS.donorNameMax) {
    errors.donorName = "too_long";
  }
  if ((input.sendingNumber ?? "").length > FIELD_LIMITS.sendingNumberMax) {
    errors.sendingNumber = "too_long";
  }
  if ((input.replyContact ?? "").length > FIELD_LIMITS.replyContactMax) {
    errors.replyContact = "too_long";
  }
  if ((input.message ?? "").length > FIELD_LIMITS.messageMax) {
    errors.message = "too_long";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const claimedAmountPoisha = parseAmountToPoisha(amountRaw)!;
  return {
    ok: true,
    value: {
      claimedAmountPoisha,
      trxIdRaw: trxRaw,
      trxIdNormalized: normalizeTrxId(trxRaw),
      transferDate: dateRaw,
      donorName: trimOrNull(input.donorName, FIELD_LIMITS.donorNameMax),
      sendingNumber: trimOrNull(input.sendingNumber, FIELD_LIMITS.sendingNumberMax),
      replyContact: trimOrNull(input.replyContact, FIELD_LIMITS.replyContactMax),
      message: trimOrNull(input.message, FIELD_LIMITS.messageMax),
    },
  };
}
