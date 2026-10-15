-- MySQL 8.4 / MariaDB 11.4. All transactional data uses InnoDB and utf8mb4.
CREATE TABLE IF NOT EXISTS donation_report_submissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  public_ref VARCHAR(32) NOT NULL UNIQUE,
  provider VARCHAR(16) NOT NULL DEFAULT 'bkash',
  recipient_number_digits VARCHAR(32) NOT NULL,
  claimed_amount_poisha BIGINT NOT NULL CHECK (claimed_amount_poisha > 0),
  trx_id_raw VARCHAR(64) NOT NULL,
  trx_id_normalized VARCHAR(256) NOT NULL,
  transfer_date DATE NOT NULL,
  donor_name VARCHAR(120) NULL,
  sending_number VARCHAR(32) NULL,
  reply_contact VARCHAR(160) NULL,
  message VARCHAR(500) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'verified', 'rejected', 'duplicate_claim')),
  duplicate_trx_flag BOOLEAN NOT NULL DEFAULT false,
  verified_amount_poisha BIGINT NULL CHECK (verified_amount_poisha IS NULL OR verified_amount_poisha > 0),
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_at TIMESTAMP(3) NULL,
  review_notes TEXT NULL,
  verified_trx_id VARCHAR(256) GENERATED ALWAYS AS
    (CASE WHEN status = 'verified' THEN trx_id_normalized ELSE NULL END) STORED,
  UNIQUE KEY idx_donation_reports_verified_transaction (provider, recipient_number_digits, verified_trx_id),
  KEY idx_donation_reports_trx_normalized (trx_id_normalized),
  KEY idx_donation_reports_status (status),
  KEY idx_donation_reports_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS request_rate_limits (
  bucket_key CHAR(64) NOT NULL,
  window_start BIGINT NOT NULL,
  hit_count INT NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  PRIMARY KEY (bucket_key, window_start),
  KEY idx_request_rate_limits_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS donation_report_locks (
  lock_key CHAR(64) NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
