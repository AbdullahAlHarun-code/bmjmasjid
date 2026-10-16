"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  isWhatsappReportAvailable,
  mosqueConfig,
} from "@/config/mosque";
import type { DonationReportCopy } from "@/content";
import { validateDonationReport } from "@/server/donation-reports/validate";
import { FIELD_LIMITS } from "@/server/donation-reports/types";

type DonationReportFormProps = {
  copy: DonationReportCopy;
  databaseConfigured: boolean;
};

type FormState = {
  amount: string;
  trxId: string;
  transferDate: string;
  donorName: string;
  sendingNumber: string;
  replyContact: string;
  message: string;
};

const emptyForm: FormState = {
  amount: "",
  trxId: "",
  transferDate: "",
  donorName: "",
  sendingNumber: "",
  replyContact: "",
  message: "",
};

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildWhatsappHref(form: FormState): string | null {
  if (!isWhatsappReportAvailable()) return null;
  const digits = mosqueConfig.whatsappReport.e164Digits;
  if (!digits) return null;
  const lines = [
    "Baitul Mamur Jame Masjid — donation report",
    form.amount ? `Amount (BDT): ${form.amount}` : null,
    form.trxId ? `TrxID: ${form.trxId}` : null,
    form.transferDate ? `Transfer date: ${form.transferDate}` : null,
    form.donorName ? `Name: ${form.donorName}` : null,
    form.sendingNumber ? `Sending bKash: ${form.sendingNumber}` : null,
    form.replyContact ? `Reply contact: ${form.replyContact}` : null,
    form.message ? `Message: ${form.message}` : null,
  ].filter(Boolean);
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function DonationReportForm({
  copy,
  databaseConfigured,
}: DonationReportFormProps) {
  const headingId = useId();
  const optionalId = useId();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [csrf, setCsrf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const idempotencyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    if (!databaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/donation-reports/csrf", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { token?: string };
        if (!cancelled && data.token) setCsrf(data.token);
      } catch {
        // Leave csrf null; submit will fail honestly.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [databaseConfigured]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const fieldIds: Record<string, string> = { amount: "dr-amount", trxId: "dr-trx", transferDate: "dr-date", donorName: "dr-name", sendingNumber: "dr-send", replyContact: "dr-reply", message: "dr-msg" };

  function showValidation(fields: Record<string, string>) {
    setFieldErrors(fields);
    if (["donorName", "sendingNumber", "replyContact", "message"].some((key) => fields[key])) setOptionalOpen(true);
    setError(copy.validationInvalid);
    requestAnimationFrame(() => document.getElementById(fieldIds[Object.keys(fields)[0]])?.focus());
  }

  function feedback(key: string) {
    if (!fieldErrors[key]) return null;
    return <p id={`${fieldIds[key]}-error`} className="mt-1 text-sm text-[#8a1f1f]">{fieldErrors[key] === "required" ? copy.validationRequired : copy.validationInvalid}</p>;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!databaseConfigured) return;
    const validated = validateDonationReport(form);
    if (!validated.ok) { showValidation(validated.errors); return; }
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setSuccessRef(null);

    try {
      const res = await fetch("/api/donation-reports", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf ?? "",
          "Idempotency-Key": idempotencyRef.current,
        },
        body: JSON.stringify({
          amount: form.amount,
          trxId: form.trxId,
          transferDate: form.transferDate,
          donorName: form.donorName,
          sendingNumber: form.sendingNumber,
          replyContact: form.replyContact,
          message: form.message,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        publicRef?: string;
        fields?: Record<string, string>;
        retryAfterSeconds?: number;
      };

      if (res.ok && data.ok && data.publicRef) {
        setSuccessRef(data.publicRef);
        idempotencyRef.current = newIdempotencyKey();
        return;
      }

      if (data.error === "validation" && data.fields) {
        showValidation(data.fields);
      } else if (data.error === "rate_limited") {
        setError(copy.rateLimited);
      } else if (data.error === "database_unavailable") {
        setError(copy.unavailable);
      } else {
        setError(copy.retryError);
      }
    } catch {
      setError(copy.retryError);
    } finally {
      setBusy(false);
    }
  }

  const whatsappHref = buildWhatsappHref(form);

  if (!databaseConfigured) {
    return (
      <section
        aria-labelledby={headingId}
        className="rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] p-5 sm:p-7"
      >
        <h2
          id={headingId}
          className="text-2xl font-semibold text-[color:var(--bm-primary)]"
        >
          {copy.heading}
        </h2>
        <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
          {copy.description}
        </p>
        <p
          className="mt-5 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] p-4 text-[color:var(--bm-text)]"
          role="status"
        >
          {copy.unavailable}
        </p>
        <p className="mt-4 text-sm text-[color:var(--bm-text-secondary)]">
          {copy.transferSeparate}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[var(--bm-radius)] border border-[color:var(--bm-border)] bg-[color:var(--bm-surface)] p-5 sm:p-7"
    >
      <h2
        id={headingId}
        className="text-2xl font-semibold text-[color:var(--bm-primary)]"
      >
        {copy.heading}
      </h2>
      <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
        {copy.description}
      </p>
      <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
        {copy.transferSeparate}
      </p>

      {successRef ? (
        <div
          className="mt-6 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-primary)]/30 bg-[color:var(--bm-background)] p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-[1.125rem] text-[color:var(--bm-text)]">{copy.success}</p>
          <p className="mt-2 font-mono text-sm text-[color:var(--bm-text-secondary)]">
            {copy.successRefLabel}: {successRef}
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <label className="block text-sm font-medium text-[color:var(--bm-text)]" htmlFor="dr-amount">
              {copy.amountLabel}
            </label>
            <input
              id="dr-amount"
              maxLength={FIELD_LIMITS.amountMaxChars}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              required
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
              aria-invalid={Boolean(fieldErrors.amount)}
              aria-describedby={`dr-amount-hint${fieldErrors.amount ? " dr-amount-error" : ""}`}
            />
            <p id="dr-amount-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
              {copy.amountHint}
            </p>
            {feedback("amount")}
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--bm-text)]" htmlFor="dr-trx">
              {copy.trxIdLabel}
            </label>
            <input
              id="dr-trx"
              maxLength={FIELD_LIMITS.trxIdMax}
              name="trxId"
              autoComplete="off"
              required
              value={form.trxId}
              onChange={(e) => update("trxId", e.target.value)}
              className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
              aria-invalid={Boolean(fieldErrors.trxId)}
              aria-describedby={`dr-trx-hint${fieldErrors.trxId ? " dr-trx-error" : ""}`}
            />
            <p id="dr-trx-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
              {copy.trxIdHint}
            </p>
            {feedback("trxId")}
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--bm-text)]" htmlFor="dr-date">
              {copy.transferDateLabel}
            </label>
            <input
              id="dr-date"
              name="transferDate"
              type="date"
              required
              value={form.transferDate}
              onChange={(e) => update("transferDate", e.target.value)}
              className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
              aria-invalid={Boolean(fieldErrors.transferDate)}
              aria-describedby={`dr-date-hint${fieldErrors.transferDate ? " dr-date-error" : ""}`}
            />
            <p id="dr-date-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
              {copy.transferDateHint}
            </p>
            {feedback("transferDate")}
          </div>

          <div>
            <button
              type="button"
              className="btn btn-secondary w-full sm:w-auto"
              aria-expanded={optionalOpen}
              aria-controls={optionalId}
              onClick={() => setOptionalOpen((v) => !v)}
            >
              {copy.optionalToggle}
            </button>
            {optionalOpen ? (
              <div id={optionalId} className="mt-4 space-y-4 border-t border-[color:var(--bm-border)] pt-4">
                <p className="text-sm text-[color:var(--bm-text-secondary)]">
                  {copy.optionalIntro}
                </p>
                <div>
                  <label className="block text-sm font-medium" htmlFor="dr-name">
                    {copy.donorNameLabel}
                  </label>
                  <input
                    id="dr-name"
                    maxLength={FIELD_LIMITS.donorNameMax}
                    aria-invalid={Boolean(fieldErrors.donorName)}
                    value={form.donorName}
                    onChange={(e) => update("donorName", e.target.value)}
                    className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
                    aria-describedby={`dr-name-hint${fieldErrors.donorName ? " dr-name-error" : ""}`}
                  />
                  <p id="dr-name-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
                    {copy.donorNameHint}
                  </p>
                  {feedback("donorName")}
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="dr-send">
                    {copy.sendingNumberLabel}
                  </label>
                  <input
                    id="dr-send"
                    maxLength={FIELD_LIMITS.sendingNumberMax}
                    aria-invalid={Boolean(fieldErrors.sendingNumber)}
                    value={form.sendingNumber}
                    onChange={(e) => update("sendingNumber", e.target.value)}
                    className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
                    aria-describedby={`dr-send-hint${fieldErrors.sendingNumber ? " dr-send-error" : ""}`}
                  />
                  <p id="dr-send-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
                    {copy.sendingNumberHint}
                  </p>
                  {feedback("sendingNumber")}
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="dr-reply">
                    {copy.replyContactLabel}
                  </label>
                  <input
                    id="dr-reply"
                    maxLength={FIELD_LIMITS.replyContactMax}
                    aria-invalid={Boolean(fieldErrors.replyContact)}
                    value={form.replyContact}
                    onChange={(e) => update("replyContact", e.target.value)}
                    className="mt-2 w-full min-h-12 rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3"
                    aria-describedby={`dr-reply-hint${fieldErrors.replyContact ? " dr-reply-error" : ""}`}
                  />
                  <p id="dr-reply-hint" className="mt-1 text-sm text-[color:var(--bm-text-secondary)]">
                    {copy.replyContactHint}
                  </p>
                  {feedback("replyContact")}
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="dr-msg">
                    {copy.messageLabel}
                  </label>
                  <textarea
                    id="dr-msg"
                    maxLength={FIELD_LIMITS.messageMax}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "dr-msg-error" : undefined}
                    rows={3}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    className="mt-2 w-full rounded-[var(--bm-radius-sm)] border border-[color:var(--bm-border)] bg-[color:var(--bm-background)] px-3 py-2"
                  />
                  {feedback("message")}
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-[#8a1f1f]" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy}>
            {busy ? copy.submitting : copy.submit}
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-[color:var(--bm-border)] pt-5">
        <p className="text-sm text-[color:var(--bm-text-secondary)]">{copy.websiteVsWhatsapp}</p>
        {whatsappHref ? (
          <>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary mt-4 w-full sm:w-auto"
            >
              {copy.whatsappButton}
            </a>
            <p className="mt-3 text-sm text-[color:var(--bm-text-secondary)]">
              {copy.whatsappExplain}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
