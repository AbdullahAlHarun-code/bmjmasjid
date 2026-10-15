# Site readiness — unresolved publication requirements

Private checklist for maintainers. Visitor-facing pages should explain current status in plain language; do not put technical TODOs on public pages.

## Confirmed still missing

- [ ] Current contact channels (phone, email, WhatsApp)
- [ ] Committee / representative identities (only after confirmation)
- [ ] Online payment provider configuration and live IPN/webhook validation
- [ ] Verified received donation totals for the campaign
- [ ] Verified expenditure and balance figures
- [ ] Dated construction updates with verified dates
- [ ] Confirmed next-work construction plan and cost estimates
- [ ] Public deployment host, custom domain, and HTTPS
- [ ] Hosting-specific privacy notes (server logs, CDN, email delivery) after a host is chosen
- [ ] Privacy and donation-policy updates when payments or forms go live
- [ ] Database for donation records (deferred)
- [ ] Authentication for any admin/reporting tools (deferred)

## Do not publish until confirmed

- Historical receipt book bank details as a current payment destination
- Zakat eligibility, tax deductibility, or registered/verified charity claims
- Map pins or coordinates presented as verified exact locations
- Progress bars or “0 received” widgets while totals are unknown
- Contact forms without a working delivery/storage backend

## Privacy inspection notes (Step 3B)

| Area | Current behaviour |
| --- | --- |
| Language cookie | `bm-locale` — Path `/`, Max-Age 1 year, SameSite=Lax, Secure on HTTPS |
| Fonts | Noto Sans Bengali via `next/font` |
| Images | Local project assets under `/public/images` |
| Analytics | None |
| Third-party embeds | None (address search opens Google Maps search in a new tab when used) |
| Forms | None |
| Personal-data collection | None |
| Public hosting | Not deployed |

Update this file when a host or payment path is selected.
