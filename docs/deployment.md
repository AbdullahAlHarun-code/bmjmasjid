# Production deployment

The site is already live over HTTPS. This workflow updates that existing app. It does not change DNS, certificates, the web server, or the database contents.

Normal workflow:

```bash
git add .
git commit -m "Describe the change"
git push origin master
```

GitHub Actions then runs CI. The production job starts only after typecheck, lint, the production build, and both MySQL 8.4 and MariaDB 11.4 donation-storage tests succeed. A push to a pull request or to `main` does not deploy.

Tracked files in that commit become what the live app runs. That includes `src/config/mosque.ts`, `src/content/bn.ts`, `src/content/en.ts`, images under `public/`, application code, and files in `db/migrations/mysql`. Donor rows and other MySQL data stay in the production database. Schema changes move only through the existing migration script.

## What runs

Workflow: `.github/workflows/ci.yml`, job `Deploy production`.

Trigger: a push to `master`, after the `checks` and `donation-storage` jobs succeed.

The runner SSHes to the server and `scripts/deploy-production.sh` does this in `PRODUCTION_PATH`:

1. Fetch `origin/master` and deploy that exact commit. It does not `git pull`. A commit that is not on `origin/master` is refused. If `origin/master` has already moved on, the older job skips so a slower CI run cannot overwrite a newer one.
2. `npm ci`
3. `node` with the existing env files, then `scripts/db-migrate.mjs` (the same script as `npm run db:migrate`)
4. `npm run build`, with the commit written into `src/server/deployed-commit.ts` so `/api/health` reports it
5. Restart the process that is already supervising the app
6. From GitHub, request `https://…/` and `https://…/api/health`. Both must return HTTP 200, and the health JSON `sha` must be the deployed commit.

Env files are read in this order, later files overriding earlier ones: `.env`, `.env.production`, `.env.local`, `.env.production.local`. A variable already exported in the SSH session wins. The script checksums those files and stops if a deploy changes them.

Restart, unless `PRODUCTION_RESTART_COMMAND` is set:

- `pm2 reload` when a PM2 process has this application directory, or is named `baitul-mamur`
- otherwise `mkdir -p tmp && touch tmp/restart.txt`, which is the usual Passenger reload for cPanel / Namecheap Node.js

Two deploys cannot run at once. GitHub queues the job, and the server holds `.deploy.lock`.

## GitHub secrets

Add these to the repository or to the `production` environment. Do not commit the values.

| Secret | Required | Value |
| --- | --- | --- |
| `PRODUCTION_HOST` | yes | SSH hostname of the existing server |
| `PRODUCTION_USER` | yes | SSH user that already owns the app |
| `PRODUCTION_SSH_KEY` | yes | Private key for that user. A public deploy key is not required; the GitHub repo is public. |
| `PRODUCTION_PATH` | yes | Absolute application root, letters, numbers, `/`, `.`, `_`, and `-` only |
| `PRODUCTION_URL` | yes | Existing public origin, such as `https://example.com`, with no path or credentials |
| `PRODUCTION_KNOWN_HOSTS` | yes | Output of `ssh-keyscan -p 22 -H your.host` (use the real port) |
| `PRODUCTION_PORT` | no | SSH port. Defaults to `22`. |
| `PRODUCTION_NODE_SETUP` | no | Shell snippet that puts the existing Node 22 on `PATH` for non-interactive SSH. Use the cPanel “virtual environment” command if Node is isolated. |
| `PRODUCTION_RESTART_COMMAND` | no | Override only when PM2 and `tmp/restart.txt` are not how this app already reloads |

Create the key on your own machine, not in the repository:

```bash
ssh-keygen -t ed25519 -f bmj-deploy -C "github-actions-bmj" -N ""
ssh-keyscan -p 22 -H YOUR_HOST
```

Append `bmj-deploy.pub` to the server user's `~/.ssh/authorized_keys`. Put the contents of `bmj-deploy` in `PRODUCTION_SSH_KEY` and the `ssh-keyscan` output in `PRODUCTION_KNOWN_HOSTS`.

## One-time server setup

Do this once on the existing host. Do not recreate the database, replace `.env*`, or edit SSL.

1. Confirm `PRODUCTION_PATH` is the directory the live Node process already uses.
2. If that directory is not a full git checkout:

```bash
cd "$PRODUCTION_PATH"
git init
git remote add origin https://github.com/AbdullahAlHarun-code/bmjmasjid.git
git fetch origin
git checkout -f --detach origin/master
```

Do not run `git clean -x`. Ignored files, including `.env`, `.env.local`, `.env.production`, and `.env.production.local`, stay in place.

3. Leave the real `DATABASE_URL`, `APP_ORIGIN`, and `CSRF_SECRET` in one of those env files. `APP_ORIGIN` must be the same HTTPS origin as `PRODUCTION_URL`. The deploy reads them and does not copy `.env.example` over them.
4. Confirm non-interactive SSH can run `node -v` (22 preferred, 20.9 minimum) and `npm -v`. If cPanel hides Node, set `PRODUCTION_NODE_SETUP` to the source command from the Node.js app screen.
5. Confirm the app still reloads the way it does today. Passenger picks up `tmp/restart.txt`. A PM2 app is reloaded when its name is `baitul-mamur` or its cwd is `PRODUCTION_PATH`. Otherwise set `PRODUCTION_RESTART_COMMAND`.
6. Add the GitHub secrets above, merge this automation to `master`, and watch the Actions run.

`npm run db:migrate` must succeed with the server's existing `DATABASE_URL`. The migration uses a named lock, skips SQL that was already applied, and refuses an edited migration file. It does not drop, truncate, or reseed tables.

## Logs, live commit, and rollback

- Actions: repository **Actions** tab, workflow **CI**, job **Deploy production**.
- Live commit: `curl -fsS "$PRODUCTION_URL/api/health"` and compare `sha` with the Actions commit. On the server, `cat "$PRODUCTION_PATH/.deployed-sha"`.
- A failed public check checks out the previous commit, reinstalls, migrates, rebuilds, and restarts, then the Actions job stays red.
- Manual rollback: revert on `master` and push, or SSH and run `ROLLBACK_MODE=1 DEPLOY_SHA=<40-char sha> APP_DIR=<PRODUCTION_PATH> bash scripts/deploy-production.sh` from a checkout that contains this script. The SHA must already be on `origin/master`.
- Rollback does not reverse SQL. Migrations are forward-only. The current migration only creates missing tables, so the previous app can still start after it has been applied.

Payment gateway settings stay unused. Do not set SSLCOMMERZ variables as part of deployment.
