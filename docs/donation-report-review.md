# Manual donation-report review workflow

Private maintainer notes. There is **no public submission listing** and **no unprotected admin endpoint**.

## What donors submit

On `/support`, after a manual bKash transfer, donors may submit:

| Field | Required | Stored as |
| --- | --- | --- |
| Amount (BDT) | Yes | `claimed_amount_poisha` (integer minor units) |
| TrxID | Yes | raw + normalized (for duplicate detection) |
| Transfer date | Yes | `transfer_date` (actual date; not replaced by “today”) |
| Donor name | Optional | text |
| Sending bKash number | Optional | text |
| Reply phone/email | Optional | text |
| Short message | Optional | text |

Server also stores: opaque `public_ref`, `idempotency_key`, `created_at`, recipient digits, provider `bkash`, and `status`.

## Statuses

| Status | Meaning | Counts in public totals? |
| --- | --- | --- |
| `pending_review` | Awaiting match to receiving-account history | No |
| `duplicate_claim` | Same normalized TrxID already claimed; kept for review | No |
| `verified` | Reviewer matched amount/date/TrxID to actual history | Only via `verified_amount_poisha` |
| `rejected` | Not matched / invalid | No |

**Never** increase fundraising totals from pending or duplicate claims. Claimed and verified amounts stay distinct.

## Reviewer steps (authorized only)

1. Access PostgreSQL with credentials that are never committed or printed.
2. List `pending_review` / `duplicate_claim` rows (private query tools only).
3. Open the receiving bKash account’s **actual** transaction history.
4. Match TrxID, amount, and transfer date. Do not auto-confirm from TrxID shape or screenshots alone.
5. On match: set `status = 'verified'`, set `verified_amount_poisha`, set `reviewed_at`.
6. On no match: set `status = 'rejected'` and optional `review_notes`.
7. For duplicate TrxID claims: keep both rows; verify at most one; do not expose other donors’ details to the public site.

## Remaining administrator requirements

- [ ] Production `DATABASE_URL` and migration (`npm run db:migrate`)
- [ ] `CSRF_SECRET` in server environment
- [ ] Private reviewer access path (VPN/bastion/admin tool) — not a public URL
- [ ] Confirmed receipt / acknowledgement policy for donors after verification
- [ ] Confirmed WhatsApp report destination (separate from bKash) if mailing-list reporting is wanted
- [ ] bKash wallet type / registered name (private follow-up)

## Security notes

- Rate limiting and idempotency keys are stored in PostgreSQL.
- Same-origin + CSRF double-submit cookie required on POST `/api/donation-reports`.
- Do not create a public JSON dump of submissions.
