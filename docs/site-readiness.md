# Site readiness — unresolved publication requirements

Private checklist for maintainers. Visitor-facing pages should explain current status in plain language; do not put technical TODOs on public pages.

## Confirmed published (interim)

- [x] Current caretaker: Rayhan Ahmed (Shishir) / রায়হান আহমেদ (শিশির)
- [x] Interim personal bKash number for manual donations: `01913331811` (display `01913-331811`)
- [x] Manual bKash availability kept separate from online gateway (`paymentsAvailable: false`)
- [x] Support-page donation report form UI (stores only when `DATABASE_URL` is configured)
- [x] Temporary bKash wordmark text “বিকাশ” (see `docs/assets/bkash-branding.md`)

## Confirmed still missing / private follow-up

- [ ] bKash wallet type (Send Money vs Payment) and registered wallet name
- [ ] Official/permitted bKash logo asset to replace temporary wordmark
- [ ] Production `DATABASE_URL` left in the existing env file (database name `neurtqox_bmjmasjid`) and migrations applied
- [ ] `CSRF_SECRET` and exact HTTPS `APP_ORIGIN` in server environment
- [ ] WhatsApp report destination (separate from bKash) — currently hidden (`whatsappReport.available: false`)
- [ ] Receipt arrangements after verification
- [ ] Private reviewer/admin access (no public listing)
- [ ] General contact channels (email, office hours)
- [ ] Committee / representative identities and titles
- [ ] Online payment provider configuration and live IPN/webhook validation
- [ ] Verified received donation totals for the campaign
- [ ] Verified expenditure and balance figures
- [ ] Dated construction updates with verified dates
- [ ] Confirmed next-work construction plan and cost estimates
- [x] Public site is live and HTTPS is already configured. Do not change DNS, certificates, or the web server. Automatic deploy: [deployment.md](./deployment.md)
- [x] Host is the existing Namecheap shared account (`neurtqox`, Node.js 22.23.3). Privacy copy states the site is public and the payment gateway is inactive.
- [ ] Authentication for any admin/reporting tools

## Do not publish until confirmed

- Historical receipt book bank details as a current payment destination
- Zakat eligibility, tax deductibility, or registered/verified charity claims
- Map pins or coordinates presented as verified exact locations
- Progress bars or “0 received” widgets while totals are unknown
- Payment QR codes, deep links, fees, automatic receipts, or auto-verification
- Institutional/merchant account claims for the interim personal bKash number
- Avatar, username, or screenshot from bKash profile
- WhatsApp linked to the bKash number without explicit confirmation

## Privacy inspection notes

| Area | Current behaviour |
| --- | --- |
| Language cookie | `bm-locale` — Path `/`, Max-Age 1 year, SameSite=Lax, Secure on HTTPS |
| CSRF cookie | `bm_csrf` — httpOnly, SameSite=Lax, used for donation-report POST |
| Fonts | Noto Sans Bengali via `next/font` |
| Images | Local project assets under `/public/images` |
| Analytics | None |
| Online donation checkout | Inactive (`paymentsAvailable: false`) |
| Manual bKash | Number on Support/Contact; transfers in bKash app |
| Donation report form | UI present; persistence requires `DATABASE_URL` |
| Public submission listing | None |
| Public hosting | Live over existing HTTPS. Deploy does not change the host, DNS, or certificates. |

See also [donation-report-review.md](./donation-report-review.md).

See [content, logo and mobile audit](./site-content-mobile-audit.md) for the latest research comparison and repeatable browser checks.
