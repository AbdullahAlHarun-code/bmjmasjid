# Content, logo and mobile review — 15 October 2026

## Evidence reviewed

- `baitul-mamur-fundraising-research.md` (revised Bangladesh/diaspora research, current Library version 1).
- `baitul-mamur-website-design-content-brief.md` (current Library copy).
- `baitul-mamur-bkash-form-researched.md` (manual-transfer reporting research).
- The owner's later confirmed caretaker/number instructions and MySQL/MariaDB decision take precedence over older database/payment plans in those documents.

Reviewed both language files and all nine pages: Home, About, Construction, Support, Updates, Transparency, Contact, Privacy and Donation policy.

## Findings and corrections

| Area | Finding | Result |
| --- | --- | --- |
| Privacy | Old text denied the existence of forms and personal-data collection | Describes actual transfer-report fields, private authorized review, the security cookie, abuse controls, and conditional WhatsApp sharing |
| Donation guidance | Wallet type remains unconfirmed; implementation language appeared in public copy | Donors check number/recipient in bKash; no invented Send Money/Payment instruction, merchant status or card checkout |
| Appeal and photographs | Undated photographs were described as “today”; invitation implied an obligation | Supplied-photo wording, voluntary participation within one's means, optional loved-one dedication and sadaqah jariyah intention without a reward guarantee |
| Goal and reporting | First target is BDT 2,000,000, not an audited total cost | Preserved; no invented received amounts, progress, dates, estimates or deadlines |
| Founder and caretaker | Confirmed history and caretaker details | Preserved; no invented committee office or additional contact destination |
| Logo | White margins made the symbol tiny; browser still used the starter favicon | Original logo remains unchanged; SVG viewport crops the circular mosque symbol for a 48–64px header/footer mark and matching embedded favicon |
| Form feedback | No client validation or field-associated error text | Shared browser/server validation, bounded fields, inline feedback, focus to the first invalid field, optional-section expansion |
| Mobile action | Support-page bottom action returned to the page top | It now targets the donation section on that page |
| Gallery landscape | Close/previous/next controls extended outside a 320px-tall viewport | Constrained grid with flexible image row and bounded caption area keeps controls in view |

The logo display viewport is `112 134 257 257` in the supplied 480×640 WebP. This is a presentation crop, not a redraw or alteration of the artwork. The full original source and optimized full logo are retained.

## Reproducible checks

Run `npm run build`, then `npm run audit:site`. The script starts a local production server unless `BM_BASE_URL` is supplied. `BM_CHROME_PATH` may point to an installed Chromium binary; CI installs Playwright Chromium. Generated screenshots/results go to ignored `docs/site-audit/` and are uploaded as the `bilingual-mobile-audit` CI artifact.

The local form fixture intentionally points to a closed loopback port. It cannot store a donation or contact a real account. Invalid-field and preservation-on-failure checks use only labelled synthetic data. Real storage tests remain separately covered by MySQL 8.4 and MariaDB 11.4 CI jobs.

The responsive matrix is 9 routes × 2 languages × 6 viewports: 320×700, 390×844, 568×320 landscape, 768×900, 1024×900 and 1440×900. Checks cover HTTP status, document language, H1/title, document overflow, header controls, image loading/alt text, logo size, old bank-number exclusion, stale copy and internal links. Interactions cover number copy, keyboard menu/focus, gallery navigation/landscape, form validation/optional fields, failed save preserving inputs, and language switching without changing the page.

## Recorded local result

Typecheck, lint and production build passed. The production browser run passed all 108 render checks, 12 interaction groups and 9 internal destinations, with no browser page errors or detected horizontal overflow. Header marks measured 48px at the narrowest viewport. Screenshots for Bangla/English home, support and privacy pages were visually inspected where applicable; the landscape gallery regression is checked programmatically.

## Remaining publication work

Production MySQL credentials/migration, private reviewer arrangements, recipient wallet name/type, an optional confirmed WhatsApp destination, domain/HTTPS and Namecheap Node.js startup configuration remain operational setup. This review does not deploy the site, activate a gateway, or verify live payments. Automated Chromium checks do not establish real-device or assistive-technology certification.
