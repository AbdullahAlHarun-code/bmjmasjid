# Baitul Mamur Jame Masjid — Fundraising Site

Foundation (Step 1) for the construction fundraising website of **বাইতুল মামুর জামে মসজিদ** (Baitul Mamur Jame Masjid) in Bhedarganj, Shariatpur, Bangladesh.

Detailed design, content, database, and payments come in later steps. This step only establishes a maintainable Next.js project with route shells and architecture boundaries.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (`strict`) |
| Styling | Tailwind CSS 4 |
| Package manager | npm (lockfile retained) |
| Runtime | Node.js **22 LTS** preferred (Next.js 16 requires ≥ 20.9) |
| Database | MySQL / MariaDB for donation-report submissions (`DATABASE_URL`; optional locally) |
| Payments | Manual bKash interim; SSLCOMMERZ gateway architecture only (inactive) |

## Local setup

```bash
# Prerequisites: Node.js 22 LTS (or ≥ 20.9), npm
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment placeholders:

```bash
cp .env.example .env.local
```

Do not commit `.env.local` or any real secrets.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run check:overflow` | Production server required — viewport overflow regression (CDP) |
| `npm run check:interactions` | Production server required — share/nav/gallery smoke (CDP) |
| `npm run db:migrate` | Apply `db/migrations/mysql` (requires `DATABASE_URL`) |

Step 4 visual QA notes: [docs/step4-verification/REPORT.md](docs/step4-verification/REPORT.md).  
Donation-report review: [docs/donation-report-review.md](docs/donation-report-review.md).

## Project structure

```
src/
  app/                 # App Router routes
  components/          # Shared UI (header, footer, page shell)
  config/              # Typed mosque + navigation config
  content/             # Bangla (default) and English copy
  styles/              # Design tokens
  server/payments/     # Server-only payment provider boundary (no live integration)
docs/
  payments-architecture.md
collections/           # Existing reference images (preserved)
.github/workflows/ci.yml
```

Editable campaign facts live in `src/config/mosque.ts`. Page copy lives in `src/content/bn.ts` (default) and `src/content/en.ts`.

## Routes

- `/` — Step 2 mobile-first homepage (hero through final invitation)
- `/about`, `/construction`, `/updates` — Step 3A complete bilingual pages
- `/support`, `/transparency`, `/contact`, `/privacy`, `/donation-policy` — Step 3B complete bilingual pages

Internal readiness notes (not visitor-facing): [docs/site-readiness.md](docs/site-readiness.md).

Shared chrome: logo header, language switch (Bangla default), accessible mobile menu, dark-green footer, mobile support bar.

Project photos/logo mapping: `src/config/assets.ts` (optimized web copies in `public/images/`; originals stay in `collections/`).

## GitHub status

Connected to: [AbdullahAlHarun-code/bmjmasjid](https://github.com/AbdullahAlHarun-code/bmjmasjid)

```bash
git remote -v
# origin  https://github.com/AbdullahAlHarun-code/bmjmasjid.git
```

Default branch: `master` (tracks `origin/master`).

CI workflow: `.github/workflows/ci.yml` (typecheck, lint, build, donation-storage tests, then production deploy on `master` only).

## Deployment

Pushing `master` deploys that exact commit to the existing Namecheap app after CI succeeds. HTTPS, DNS, the database, and uploaded files stay as they are. SSH is `premium55-5.web-hosting.com` port `21098`. See [docs/deployment.md](docs/deployment.md) for secrets, the one-time server setup, and rollback.

```bash
git push origin master
```

## Deferred / prerequisites

- Server-side `DATABASE_URL` in an existing env file (never committed). Deploy runs `npm run db:migrate` against that database and does not replace donor rows.
- Confirmed WhatsApp report destination (separate from bKash)
- SSLCOMMERZ (or other) live payment gateway integration — not part of deployment
- Official bKash logo asset (temporary wordmark in use)

See [docs/payments-architecture.md](docs/payments-architecture.md). Browser redirects alone must never mark donations paid. Pending form claims never increase public totals.

## Design tokens (initial)

| Token | Value |
| --- | --- |
| Primary | `#0B4F3C` |
| Background | `#FFFDF8` |
| Surface | `#FFFFFF` |
| Text | `#17251F` |
| Secondary text | `#52645B` |
| Accent | `#C79A3B` |

Font: **Noto Sans Bengali** via `next/font`, with system sans fallbacks.

### Whole-site browser audit

After `npm run build`, run `npm run audit:site` (install Chromium with `npx playwright install chromium` first). This checks both languages, all pages and mobile/landscape/desktop layouts without touching real donation data. See [audit notes](docs/site-content-mobile-audit.md).
