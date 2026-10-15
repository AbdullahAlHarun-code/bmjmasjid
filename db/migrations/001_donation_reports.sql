-- Manual bKash donation-report submissions (not gateway payments).
-- Claimed amounts stay separate from verified amounts.
-- Pending / duplicate claims must never increase public fundraising totals.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donation_report_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'bkash',
  recipient_number_digits text NOT NULL,
  claimed_amount_poisha bigint NOT NULL CHECK (claimed_amount_poisha > 0),
  trx_id_raw text NOT NULL,
  trx_id_normalized text NOT NULL,
  transfer_date date NOT NULL,
  donor_name text NULL,
  sending_number text NULL,
  reply_contact text NULL,
  message text NULL,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'verified', 'rejected', 'duplicate_claim')),
  duplicate_trx_flag boolean NOT NULL DEFAULT false,
  verified_amount_poisha bigint NULL
    CHECK (verified_amount_poisha IS NULL OR verified_amount_poisha > 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL,
  review_notes text NULL
);

CREATE INDEX IF NOT EXISTS idx_donation_reports_trx_normalized
  ON donation_report_submissions (trx_id_normalized);

CREATE INDEX IF NOT EXISTS idx_donation_reports_status
  ON donation_report_submissions (status);

CREATE INDEX IF NOT EXISTS idx_donation_reports_created_at
  ON donation_report_submissions (created_at DESC);

-- Persistent rate limiting (not in-memory).
CREATE TABLE IF NOT EXISTS request_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_request_rate_limits_window
  ON request_rate_limits (window_start);
