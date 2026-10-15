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
| Database | PostgreSQL planned later (not connected) |
| Payments | SSLCOMMERZ planned first (architecture only) |

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

## Routes (shells)

- `/` — simple working homepage
- `/about`, `/construction`, `/support`, `/updates`, `/transparency`
- `/contact`, `/privacy`, `/donation-policy`

Navigation is wired through the shared header and footer. Final designs are deferred.

## GitHub status

Connected to: [AbdullahAlHarun-code/bmjmasjid](https://github.com/AbdullahAlHarun-code/bmjmasjid)

```bash
git remote -v
# origin  https://github.com/AbdullahAlHarun-code/bmjmasjid.git
```

Default branch: `master` (tracks `origin/master`).

CI workflow: `.github/workflows/ci.yml` (typecheck, lint, build on Node 22).

## Deferred work (not in Step 1)

- PostgreSQL donation records
- SSLCOMMERZ (or other) live payment integration
- Credentials, IPN/webhook endpoints, transaction validation
- Public deployment
- Final mobile-first visual design and full content

See [docs/payments-architecture.md](docs/payments-architecture.md). Browser redirects alone must never mark donations paid.

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
