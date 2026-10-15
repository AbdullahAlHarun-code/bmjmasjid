# Production deployment

The site is already live over HTTPS on Namecheap shared hosting. This workflow updates that existing cPanel Node.js app. It does not change DNS, certificates, the web server, the database, or uploaded files.

Confirmed for this account:

| Item | Value |
| --- | --- |
| SSH hostname | `premium55-5.web-hosting.com` |
| SSH port | `21098` |
| SSH user | `neurtqox` |
| Public URL | `https://bmjmasjid.neuroncosmo.com` |
| Node.js | 22.23.3, via the cPanel application virtual environment |
| MySQL database | `neurtqox_bmjmasjid` |

`premium55.web-hosting.com` is a different server. Port 22 and port 2222 do not accept SSH on this host. The application root and the `source …/nodevenv/…/bin/activate` command are shown in cPanel under **Setup Node.js App**. Copy them from that screen. Do not invent either path.

Normal workflow:

```bash
git add .
git commit -m "Describe the change"
git push origin master
```

GitHub Actions then runs CI. The production job starts only after typecheck, lint, the production build, the bilingual mobile audit, and both MySQL 8.4 and MariaDB 11.4 donation-storage tests succeed. A push to a pull request or to `main` does not deploy.

Tracked files in that commit become what the live app runs. That includes `src/config/mosque.ts`, `src/content/bn.ts`, `src/content/en.ts`, images under `public/`, application code, and files in `db/migrations/mysql`. Donor rows and other MySQL data stay in the production database. Schema changes move only through the existing migration script.

## What runs

Workflow: `.github/workflows/ci.yml`, job `Deploy production`.

Trigger: a push to `master`, after the `checks`, `donation-storage`, and `site-audit` jobs succeed.

The runner SSHes to the server and `scripts/deploy-production.sh` does this in `PRODUCTION_PATH`:

1. Fetch `origin/master` and deploy that exact commit. It does not `git pull`. A commit that is not on `origin/master` is refused. If `origin/master` has already moved on, the older job skips so a slower CI run cannot overwrite a newer one.
2. `npm ci`
3. `node` with the existing env files, then `scripts/db-migrate.mjs` (the same script as `npm run db:migrate`)
4. `npm run build`, with the commit written into `src/server/deployed-commit.ts` so `/api/health` reports it
5. Restart Passenger by touching `tmp/restart.txt` in the application root
6. From GitHub, request `https://…/` and `https://…/api/health`. Both must return HTTP 200, and the health JSON `sha` must be the deployed commit.

Env files are read in this order, later files overriding earlier ones: `.env`, `.env.production`, `.env.local`, `.env.production.local`. A variable already exported in the SSH session wins. The script checksums those files and stops if a deploy changes them.

Restart, unless `PRODUCTION_RESTART_COMMAND` is set: `mkdir -p tmp && touch tmp/restart.txt` inside `PRODUCTION_PATH`. That is the reload cPanel's Node.js selector (Phusion Passenger) already uses on this Namecheap account. The script does not call `pm2`. Set `PRODUCTION_RESTART_COMMAND` only when cPanel shows a different reload for this application.

Two deploys cannot run at once. GitHub queues the job, and the server holds `.deploy.lock`.

## GitHub secrets

Add these to the repository or to the `production` environment. Do not commit the values.

| Secret | Required | Value |
| --- | --- | --- |
| `PRODUCTION_HOST` | yes | `premium55-5.web-hosting.com` |
| `PRODUCTION_USER` | yes | `neurtqox` |
| `PRODUCTION_SSH_KEY` | yes | Private key for that user. A public deploy key is not required; the GitHub repo is public. |
| `PRODUCTION_PATH` | yes | cPanel **Application root**, absolute, letters, numbers, `/`, `.`, `_`, and `-` only |
| `PRODUCTION_URL` | yes | `https://bmjmasjid.neuroncosmo.com` |
| `PRODUCTION_KNOWN_HOSTS` | yes | Output of `ssh-keyscan -p 21098 -H premium55-5.web-hosting.com` |
| `PRODUCTION_PORT` | yes | `21098`. If the secret is empty, the script uses `21098`. |
| `PRODUCTION_NODE_SETUP` | yes | cPanel command that starts with `source /home/neurtqox/nodevenv/…/bin/activate`. The script returns to `PRODUCTION_PATH` afterwards. |
| `PRODUCTION_RESTART_COMMAND` | no | Leave empty. Passenger reloads from `tmp/restart.txt`. |

Create the key on your own machine, not in the repository:

```bash
ssh-keygen -t ed25519 -f bmj-deploy -C "github-actions-bmj" -N ""
ssh-keyscan -p 21098 -H premium55-5.web-hosting.com
```

Append `bmj-deploy.pub` to `/home/neurtqox/.ssh/authorized_keys`. Put the contents of `bmj-deploy` in `PRODUCTION_SSH_KEY` and the `ssh-keyscan` output in `PRODUCTION_KNOWN_HOSTS`.

Host key fingerprints measured on port 21098, so the scan can be checked before saving it:

- ED25519 `SHA256:VCZceygcfUd5F3DLt2KMYA0LFUymF6koIYf2QtoKQQQ`
- ECDSA `SHA256:ClP7qRGngziwG50+rh5eCSviHw3zv37bU6ELPHYPG24`
- RSA `SHA256:WNwJlODGdvyYgxHcz3v16YlF9j3K65WRpzM+w+4wDas`

## One-time server setup

Do this once on the existing host. Do not recreate the database, replace `.env*`, or edit SSL.

1. In cPanel → **Setup Node.js App**, copy **Application root** into `PRODUCTION_PATH`. That directory is where Passenger watches `tmp/restart.txt`. It may differ from `public_html`. Copy the virtual-environment command into `PRODUCTION_NODE_SETUP`.
2. If that application root is not a full git checkout:

```bash
cd "$PRODUCTION_PATH"
git init
git remote add origin https://github.com/AbdullahAlHarun-code/bmjmasjid.git
git fetch origin
git checkout -f --detach origin/master
```

Do not run `git clean`, `git clean -x`, or `git clean -fd`. Ignored files stay in place, including `.env`, `.env.local`, `.env.production`, and `.env.production.local`. Untracked startup files such as the cPanel `app.js` wrapper, and untracked uploads, also stay in place.

3. Leave the real `DATABASE_URL`, `APP_ORIGIN`, and `CSRF_SECRET` in one of those env files. `DATABASE_URL` must keep using `neurtqox_bmjmasjid`. `APP_ORIGIN` must be `https://bmjmasjid.neuroncosmo.com`. The deploy reads them and does not copy `.env.example` over them.
4. SSH in as `neurtqox` and run the `PRODUCTION_NODE_SETUP` command, then `node -v` and `npm -v`. The expected Node version is 22.23.3. Non-interactive SSH does not see that Node until the virtual environment is sourced.
5. From the application root, run `mkdir -p tmp && touch tmp/restart.txt` once by hand and reload the public site. Passenger must come back on the same URL. Leave `PRODUCTION_RESTART_COMMAND` empty after that succeeds.
6. Add the GitHub secrets above. Merge this automation to `master` only after those secrets exist and the application root is a git checkout of this repository. Then watch the Actions run. `https://bmjmasjid.neuroncosmo.com/api/health` must return the deployed commit.

`npm run db:migrate` must succeed with the server's existing `DATABASE_URL`. The migration uses a named lock, skips SQL that was already applied, and refuses an edited migration file. It does not drop, truncate, or reseed tables.

## Logs, live commit, and rollback

- Actions: repository **Actions** tab, workflow **CI**, job **Deploy production**.
- Live commit: `curl -fsS "$PRODUCTION_URL/api/health"` and compare `sha` with the Actions commit. On the server, `cat "$PRODUCTION_PATH/.deployed-sha"`.
- A failed public check checks out the previous commit, reinstalls, migrates, rebuilds, and restarts, then the Actions job stays red.
- Manual rollback: revert on `master` and push, or SSH and run `ROLLBACK_MODE=1 DEPLOY_SHA=<40-char sha> APP_DIR=<PRODUCTION_PATH> bash scripts/deploy-production.sh` from a checkout that contains this script. The SHA must already be on `origin/master`.
- Rollback does not reverse SQL. Migrations are forward-only. The current migration only creates missing tables, so the previous app can still start after it has been applied.

Payment gateway settings stay unused. Do not set SSLCOMMERZ variables as part of deployment.
