# Payments architecture (deferred)

This document describes the planned donation payment boundary. **No payment
integration is active in Step 1.**

## Goals

- Keep website content and donation records independent of any single gateway.
- Run initiation, credentials, IPN/webhook handling, and transaction validation
  **only on the server**.
- Never mark a donation paid from a browser redirect alone.

## Planned first provider

- **SSLCOMMERZ** (Bangladesh)
- Other gateways may be added behind the same `PaymentProvider` interface in
  `src/server/payments/`.

## Donation states

| State | Meaning |
| --- | --- |
| `pledged` | Intent recorded; no gateway session yet (or offline pledge). |
| `pending` | Payment initiated with a provider; awaiting verification. |
| `verified` | Server validated amount/currency and provider confirmation. |

Only a successful **server-side** validation may move a record to `verified`.

## Flow (future)

1. User chooses an amount on `/support` (UI later).
2. Server creates a `pending` donation row (PostgreSQL — not connected yet).
3. Server calls `PaymentProvider.initiatePayment` (SSLCOMMERZ first).
4. Browser redirects to the gateway.
5. Gateway sends IPN/webhook (and/or the app queries the gateway).
6. Server runs `validateNotification`:
   - Verify authenticity/signature with server-held credentials
   - Reject amount or currency mismatches
   - Treat duplicate notifications as idempotent (`duplicate: true`)
7. On success, transition `pending` → `verified`.
8. Success/fail return URLs only show status pages; they do **not** update
   payment state.

## Separation of concerns

| Layer | Responsibility |
| --- | --- |
| `src/content`, `src/config` | Editable mosque/campaign copy — no gateway logic |
| Donation records (DB later) | Amounts, states, provider references |
| `src/server/payments` | Provider interface + SSLCOMMERZ (later) adapter |
| Route handlers / Server Actions | Initiation + IPN endpoints (later) |

## Credentials

Placeholders only in `.env.example`. Real keys stay in local/host secrets and
are never committed. Database and payment accounts are out of scope for Step 1.
