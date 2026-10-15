"use client";

import { useEffect, useId, useState } from "react";
import { BkashWordmark } from "@/components/BkashWordmark";
import { mosqueConfig, t, type Locale } from "@/config/mosque";
import type { SupportContent } from "@/content";
import { copyText } from "@/lib/clipboard";

type BkashDonateCardProps = {
  locale: Locale;
  copy: SupportContent["bkash"];
};

export function BkashDonateCard({ locale, copy }: BkashDonateCardProps) {
  const headingId = useId();
  const statusId = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const bkash = mosqueConfig.manualBkash;
  const caretaker = mosqueConfig.caretaker;

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function onCopy() {
    try {
      await copyText(bkash.numberDigits);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const statusMessage =
    status === "copied" ? copy.copied : status === "error" ? copy.copyError : "";

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[var(--bm-radius)] border-2 border-[color:var(--bm-primary)]/25 bg-[color:var(--bm-background)] p-5 shadow-[var(--bm-shadow)] sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-3">
        <BkashWordmark label={copy.brandWordmark} />
        <h2
          id={headingId}
          className="text-2xl font-semibold text-[color:var(--bm-primary)] sm:text-3xl"
        >
          {copy.heading}
        </h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--bm-text-secondary)]">{copy.brandNote}</p>

      <p className="mt-4 text-[1.125rem] leading-[1.7] text-[color:var(--bm-text)]">
        {copy.explanation}
      </p>

      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-sm font-medium text-[color:var(--bm-text-secondary)]">
            {copy.numberLabel}
          </dt>
          <dd className="mt-1 break-all font-mono text-2xl font-semibold tracking-wide text-[color:var(--bm-text)] sm:text-3xl">
            {bkash.numberDisplay}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--bm-text-secondary)]">
            {copy.caretakerLabel}
          </dt>
          <dd className="mt-1 text-lg font-medium text-[color:var(--bm-text)]">
            {t(caretaker.displayName, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--bm-text-secondary)]">
            {copy.internationalLabel}
          </dt>
          <dd className="mt-1 font-mono text-base text-[color:var(--bm-text)]">
            {bkash.numberInternational}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          onClick={onCopy}
          aria-describedby={statusId}
        >
          {copy.copyNumber}
        </button>
        <p
          id={statusId}
          className="mt-3 min-h-6 text-sm text-[color:var(--bm-text-secondary)]"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </div>

      <ul className="mt-6 space-y-3 border-t border-[color:var(--bm-border)] pt-5 text-[color:var(--bm-text-secondary)]">
        <li>{copy.verifyBeforeConfirm}</li>
        <li>{copy.notAutoVerified}</li>
        <li>{copy.abroadNote}</li>
      </ul>
    </section>
  );
}