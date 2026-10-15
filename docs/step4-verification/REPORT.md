# Step 4 — Production visual and interaction verification

## Environment

| Item | Value |
| --- | --- |
| Commit tested | Baseline `aede4ab`; Step 4 landed in `b86dc0a` / `da79079` (+ follow-up) |
| Runtime | Node.js local, Next.js 16.4.1 production server |
| Commands | `npm run build` then `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000` |
| Base URL | `http://127.0.0.1:3000` |
| Viewports | 320×700, 390×844, 768×900, 1440×900 |
| Languages | Bangla (`bm-locale=bn`), English (`bm-locale=en`) |

No development overlays were used for final evidence. DevTools badges in older Step 3B screenshots came from `next dev`.

## Original clipping finding

`docs/step3b-screenshots/support-390.jpeg` appeared to cut off:

- header language controls on the right
- mid-word truncation in intro/caption lines
- photo card and mobile support bar on the right edge

Step 3B also reported `scrollWidth === clientWidth` (no overflow) for the same routes, which conflicted with that image.

## Root cause

**Screenshot-capture defect, not a layout overflow defect.**

Step 3B captured screenshots with Chromium CLI:

```text
chrome --headless=new --window-size=390,844 --screenshot=file.jpeg URL
```

On this Windows host, that method produced a **horizontally cropped frame** of a correctly laid-out page:

| Capture method | Support CTA left/right gaps at 390px |
| --- | --- |
| Chrome CLI `--window-size --screenshot` | left ≈ 19px, **right = 0px** (cropped) |
| CDP `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot` | left ≈ 33px, **right ≈ 40px** (balanced) |

Production DOM measurements (Playwright/CDP) at 320/390 Bangla and English:

- `documentElement.scrollWidth === clientWidth` (no horizontal overflow)
- intro/caption `scrollWidth ≈ clientWidth` with `white-space: normal` (text wraps; not clipped)
- language controls and menu button stay inside the viewport
- intentionally full-bleed elements (header background, fixed mobile bar shell) are not content overflow

Regression: `node scripts/check-viewport-overflow.mjs` → **72** route/viewport/locale checks, **0** overflow findings (`overflow-check.json`).

## Changes made

**No payment, database, content-page, or package-version changes.**

Small layout hardening (already on `master` in `b86dc0a`) for tighter mobile headers / even gutters — not a fix for CSS overflow, which was not present:

- `scrollbar-gutter: stable` on `html`
- Header row `min-w-0`, brand `flex-1`, controls `shrink-0`, slightly tighter language-button padding under `sm`

Verification tooling and evidence:

- `scripts/check-no-horizontal-overflow.mjs` — Playwright overflow check (optional if Playwright is installed)
- `scripts/check-viewport-overflow.mjs` — CDP overflow check (no new npm deps; uses local Chromium)
- `scripts/capture-step4-screenshots.mjs` — CDP device-metrics screenshots
- `scripts/check-interactions.mjs` — share/nav/gallery/language smoke checks
- `docs/step4-verification/*` — report, JSON results, production screenshots
- npm scripts: `check:overflow`, `check:interactions`, `capture:step4`

Kept `_probe-chrome-cli-support-390.jpeg` / `_repro-chrome-window-size-390.jpeg` as evidence of the cropped CLI capture.

## Checks performed

### Layout / overflow

- `/support` at 320 and 390 in Bangla and English: measured; no overflow; controls usable
- All nine routes × four viewports × two locales: overflow script OK
- Distinguishes full-bleed chrome from clipped content

### Language and navigation

- Language switch on `/support`: path stays `/support`; `document.documentElement.lang`, title, and `h1` update (`interaction-check.json`)
- Footer link About → Support lands on `/support`
- Mobile menu opens (`aria-expanded=true`) and Escape closes it
- Body padding-bottom `76px` on mobile leaves room for the sticky support bar

### Gallery keyboard

- Opens dialog, close control present, Escape closes dialog
- Broken-image count after load: 0 (complete images with `naturalWidth === 0`)

### Sharing

- WhatsApp URL is `https://wa.me/?text=…` with encoded Bangla message and **runtime** `http://127.0.0.1:3000/support` (not GitHub / invented domain / hardcoded localhost string in source)
- Copy-link **failure** path verified in headless CDP (document not focused) → accessible error status text shown
- Copy-link **success** previously verified in Playwright when the document could receive clipboard focus (status “লিংক কপি হয়েছে”, clipboard = current page URL)
- Native share: `navigator.share` **supported** in the Chromium used for CDP checks; the system share sheet itself was not exercised end-to-end in headless mode

### Reduced motion

- With `prefers-reduced-motion: reduce`, `html` computed `scroll-behavior` is `auto`

### Quality gates

- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Console / images

- Support page: 0 broken images, 0 forms, no payment/checkout UI
- No fake payment or message-sent success states

## Unperformed checks / limitations

- Native OS share sheet acceptance/cancel UI not fully exercised in headless Chrome
- Full manual keyboard audit of every focusable control on every route was not recorded step-by-step; menu + gallery Escape/focus paths were automated
- Copy-link success depends on document focus/clipboard permissions; headless CDP often hits the failure path (which is handled)
- AI image-description tools may still *describe* tight-but-valid margins as “clipping”; pixel gap measurements and DOM metrics are authoritative
- Public deployment, payments, database, and credentials remain out of scope

## Screenshot paths

Production CDP captures (authoritative):

- `docs/step4-verification/support-bn-320.jpeg`
- `docs/step4-verification/support-bn-390.jpeg`
- `docs/step4-verification/support-en-390.jpeg`
- `docs/step4-verification/support-bn-1440.jpeg`
- `docs/step4-verification/support-bn-390-full.jpeg`
- `docs/step4-verification/home-bn-390.jpeg`
- `docs/step4-verification/home-bn-1440.jpeg`
- `docs/step4-verification/home-bn-390-full.jpeg`

Evidence of bad capture method:

- `docs/step4-verification/_probe-chrome-cli-support-390.jpeg`

JSON:

- `docs/step4-verification/overflow-check.json`
- `docs/step4-verification/interaction-check.json`

## Remaining launch requirements

Unchanged from `docs/site-readiness.md`: confirmed contacts, payment provider + IPN, verified totals, hosting/HTTPS, policy updates when payments go live. Do not treat Step 3B CLI screenshots as layout truth; use CDP/Playwright viewport capture for future visual QA.
