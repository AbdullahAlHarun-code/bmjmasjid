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


## Storage verification follow-up

`npm run test:donation-storage` boots the production build locally and runs HTTP checks against an explicitly configured disposable PostgreSQL database. It requires `DONATION_TEST_DATABASE_URL` ending in `/donation_test`, refuses a database containing submissions, and removes its labelled test rows. Never point this command at a real donation database. Apply migrations twice and build before running it. CI supplies its own ephemeral PostgreSQL 17 service; no production credential is needed.

Checks cover persistence after acknowledgement, Bangla amounts, today's Bangladesh transfer date, malformed JSON field types, impossible dates, concurrent retries, changed retry conflicts, concurrent duplicate claims, verified-only totals, prevention of double verification, rate limiting, oversized requests and actual database-write failure. Retries with changed content return 409 and never replace a prior submission. Retry requests still count against the existing eight-request fixed-window limit.

Migration 002 adds a partial unique index for verified provider/recipient/TrxID. If older records already contain multiple verified claims, migration fails for private reconciliation rather than modifying them automatically. The migration command loads `.env.local` on Node 22; values must remain server-only.

Rate limits ignore forwarded IP headers by default, using one conservative shared bucket. Only set `DONATION_TRUST_PROXY_IP=true` when the reverse proxy overwrites `X-Real-IP` and blocks direct access to the app. Confirm this hosting arrangement before activation. No paid service, public deployment or payment gateway is enabled by these checks.
