# Site readiness — unresolved publication requirements

Private checklist for maintainers. Visitor-facing pages should explain current status in plain language; do not put technical TODOs on public pages.

## Confirmed published (interim)

- [x] Current caretaker: Rayhan Ahmed (Shishir) / রায়হান আহমেদ (শিশির)
- [x] Interim personal bKash number for manual donations: `01913331811` (display `01913-331811`)
- [x] Manual bKash availability kept separate from online gateway (`paymentsAvailable: false`)

## Confirmed still missing / private follow-up

- [ ] bKash wallet type (Send Money vs Payment) and registered wallet name — keep private until confirmed
- [ ] Receipt arrangements and reconciliation process details
- [ ] General contact channels (email, office hours, WhatsApp) — do not assume WhatsApp on the bKash number
- [ ] Committee / representative identities and titles (only after confirmation)
- [ ] Online payment provider configuration and live IPN/webhook validation
- [ ] Verified received donation totals for the campaign
- [ ] Verified expenditure and balance figures
- [ ] Dated construction updates with verified dates
- [ ] Confirmed next-work construction plan and cost estimates
- [ ] Public deployment host, custom domain, and HTTPS
- [ ] Hosting-specific privacy notes (server logs, CDN, email delivery) after a host is chosen
- [ ] Privacy and donation-policy updates when an online gateway or forms go live
- [ ] Database for donation records (deferred)
- [ ] Authentication for any admin/reporting tools (deferred)

## Do not publish until confirmed

- Historical receipt book bank details as a current payment destination
- Zakat eligibility, tax deductibility, or registered/verified charity claims
- Map pins or coordinates presented as verified exact locations
- Progress bars or “0 received” widgets while totals are unknown
- Contact forms without a working delivery/storage backend
- Payment QR codes, deep links, fees, automatic receipts, or transfer verification
- Institutional/merchant account claims for the interim personal bKash number
- Avatar, username, or screenshot from bKash profile

## Privacy inspection notes

| Area | Current behaviour |
| --- | --- |
| Language cookie | `bm-locale` — Path `/`, Max-Age 1 year, SameSite=Lax, Secure on HTTPS |
| Fonts | Noto Sans Bengali via `next/font` |
| Images | Local project assets under `/public/images` |
| Analytics | None |
| Third-party embeds | None (address search opens Google Maps search in a new tab when used) |
| Forms | None |
| Online donation checkout | Inactive (`paymentsAvailable: false`) |
| Manual bKash | Number published on Support/Contact; transfers happen in bKash; site does not collect transaction details |
| Personal-data collection | None |
| Public hosting | Not deployed |

Update this file when a host or payment path is selected.
