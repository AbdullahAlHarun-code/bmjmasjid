-- A real transfer may be verified only once, including competing donor claims.
-- Existing conflicting data deliberately prevents migration until privately reconciled.
CREATE UNIQUE INDEX IF NOT EXISTS idx_donation_reports_verified_transaction
  ON donation_report_submissions (provider, recipient_number_digits, trx_id_normalized)
  WHERE status = 'verified';
