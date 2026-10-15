# Step 4 verification report

## Environment

| Item | Value |
| --- | --- |
| Base commit tested | `aede4ab` (Step 3B) plus Step 4 fixes in this commit |
| Commands | `npm run build` then `npm run start` |
| URL | `http://localhost:3000` |
| Node | v24.18.0 |
| npm | 11.16.0 |
| Next.js | 16.4.1 (production) |
| Capture tool (correct) | Playwright `page.setViewportSize` + `page.screenshot` |
| Capture tool (incorrect / repro) | Chromium `--headless --window-size=390,844 --screenshot=` |

## Original finding

`docs/step3b-screenshots/support-390.jpeg` cuts off the English language control (visible as a lone “E”), intro lines and captions at the right edge.

## Root cause

**Screenshot capture defect**, not a CSS layout overflow defect.

Step 3A/3B mobile screenshots were produced with Chromium headless using `--window-size=W,H --screenshot=…`. That sets the **browser window** size; it does **not** set a reliable CSS mobile viewport. The resulting image crops the laid-out page so header controls and text appear clipped.

### Evidence

1. **Reproduction (bad method)** — `_repro-chrome-window-size-390.jpeg` and `_probe-chrome-cli-support-390.jpeg` recreate the same right-edge cut-off against the live production server.
2. **Correct viewport metrics (Playwright)** on `/support` at 390 CSS px:
   - `documentElement.scrollWidth <= clientWidth` (no horizontal overflow)
   - English button fully in view (`textContent === "English"`, `getBoundingClientRect().right ≈ 307` with `innerWidth === 390`)
   - Menu button right ≈ 359, inside the content box
3. **Correct capture** — `support-390.jpeg` / `support-320.jpeg` show full “English” and complete caption lines.

Do **not** use Chrome `--window-size` alone for mobile evidence. Use Playwright (or DevTools device metrics / `Emulation.setDeviceMetricsOverride`).

## Changes made

1. Documented root cause and corrected capture process (this report + regression script).
2. Small header resilience: `min-w-0` / `shrink-0`, slightly tighter language-button padding on small screens (does not hide overflow).
3. `html { scrollbar-gutter: stable; }` so classic scrollbars do not make the right gutter look missing.
4. `data-scroll-behavior="smooth"` on `<html>` for the Next.js scroll warning.
5. `scripts/check-no-horizontal-overflow.mjs` + `npm run check:overflow` (requires Playwright + a running server).

No payments, database, credentials, deployment or new features.

## Checks performed (production server)

| Check | Result |
| --- | --- |
| All 9 routes × 320 / 390 / 768 / 1440 overflow metrics | Pass (`overflowFailures: []`) |
| English control clipped | Pass (false at all measured viewports) |
| Language switch preserves route + updates `lang` / title | Pass (`/construction` → en → bn) |
| Mobile menu open + Escape close | Pass |
| Footer link to `/transparency` | Pass |
| Gallery: open (Enter), Tab / Shift+Tab, Escape, focus restore | Pass |
| WhatsApp share uses current page URL (`localhost:3000/support`), `encodeURIComponent`, not hardcoded prod domain | Pass |
| Copy link status | Pass (`লিংক কপি হয়েছে`) |
| Images on `/support` load (`naturalWidth > 0`) | Pass |
| `prefers-reduced-motion: reduce` media | Pass (emulated) |
| Console / page errors during suite | None recorded |

## Screenshots (corrected)

| File | Notes |
| --- | --- |
| `support-320.jpeg` | Production, Playwright viewport |
| `support-390.jpeg` | Production, Playwright viewport |
| `support-390-full.jpeg` | Full-page mobile |
| `support-1440.jpeg` | Desktop |
| `home-390.jpeg` / `home-1440.jpeg` | Homepage |
| `updates-390.jpeg` / `gallery-open-390.jpeg` | Updates + lightbox |
| `_repro-chrome-window-size-390.jpeg` | Evidence of bad capture method |

## Unavailable / limited checks

| Item | Limitation |
| --- | --- |
| Real OS share sheet (iOS/Android) | Chromium reports `navigator.share`; full system UI not exercised |
| Physical devices / Safari / Firefox | Not run |
| Sticky bar vs real software keyboard | Not run |
| `npm run check:overflow` in CI | Needs Playwright installed + server; not wired as a required CI job |
| Public deployment HTTPS URL in share text | Localhost expected until deploy |

## Remaining launch requirements

See `docs/site-readiness.md` (contact channels, payments, verified totals, hosting, etc.).
