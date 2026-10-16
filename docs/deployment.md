# Production deployment

The site is already live over HTTPS on Namecheap shared hosting. This workflow updates that existing cPanel Node.js app. It does not change DNS, certificates, the web server, the database, or uploaded files.

Confirmed for this account:

| Item | Value |
| --- | --- |
| SSH hostname | `premium55-5.web-hosting.com` |
| SSH port | `21098` |
| SSH user | `neurtqox` |
| Application root | `/home/neurtqox/apps/bmjmasjid` |
| Node activation | `source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate` |
| Public URL | `https://bmjmasjid.neuroncosmo.com` |
| Node.js | 22.23.3 |
| MySQL database | `neurtqox_bmjmasjid` |
| Process manager | cPanel Phusion Passenger |

`premium55.web-hosting.com` is a different server. Port 22 and port 2222 do not accept SSH on this host. The runner refuses any host, user, port, path, URL, or Node activation command other than the values above.

Normal workflow:

```bash
git add .
git commit -m "Describe the change"
git push origin master
```

GitHub Actions then runs CI. The production job starts only after typecheck, lint, the production build, the bilingual mobile audit, and both MySQL 8.4 and MariaDB 11.4 donation-storage tests succeed, and only when the repository variable `PRODUCTION_DEPLOY_ENABLED` is `true`. A push to a pull request or to `main` does not deploy. Leaving that variable unset keeps a merge from changing the server.

Tracked files in that commit become what the live app runs. That includes `src/config/mosque.ts`, `src/content/bn.ts`, `src/content/en.ts`, images under `public/`, application code, and files in `db/migrations/mysql`. Donor rows and other MySQL data stay in the production database. Schema changes move only through the existing migration script.

## What runs

Workflow: `.github/workflows/ci.yml`, job `Deploy production`.

Trigger: a push to `master`, after the `checks`, `donation-storage`, and `site-audit` jobs succeed, and `PRODUCTION_DEPLOY_ENABLED` is `true`. Until that variable is set, the deploy job is skipped.

The runner SSHes to the server and `scripts/deploy-production.sh` does this in `PRODUCTION_PATH`:

1. Fetch `refs/heads/master` into `refs/remotes/origin/master` and deploy that exact commit. It does not `git pull`. A commit that is not on `origin/master` is refused. If `origin/master` has already moved on, the older job skips so a slower CI run cannot overwrite a newer one. Tracked local edits in the live tree, other than the generated commit stamp, also stop the deploy.
2. GitHub Actions compiles the commit with Turbopack. The Namecheap host's glibc cannot load that compiler, so the runner uploads the finished `.next` directory. On the server, a temporary worktree beside the application (`bmj-stage.*`) runs `npm ci` and the migration, then receives that build. The live `.next` and `node_modules` stay in place until the build and migration succeed. Env files are symlinked, not copied or rewritten.
3. Only after that build succeeds, check out the commit in the application root, move the new `node_modules` and `.next` into place, and write the commit into `src/server/deployed-commit.ts` so `/api/health` reports it.
4. Restart Passenger by touching `tmp/restart.txt` in the application root. The stage directory is removed after the move.
5. From GitHub, request `https://…/` and `https://…/api/health`. Both must return HTTP 200, and the health JSON `sha` must be the deployed commit.

Env files are read in this order, later files overriding earlier ones: `.env`, `.env.production`, `.env.local`, `.env.production.local`. A variable already exported in the SSH session wins. The script checksums those files and stops if a deploy changes them.

Restart, unless `PRODUCTION_RESTART_COMMAND` is set: `mkdir -p tmp && touch tmp/restart.txt` inside `PRODUCTION_PATH`. That is the reload cPanel's Node.js selector (Phusion Passenger) already uses on this Namecheap account. The script does not call `pm2`. Set `PRODUCTION_RESTART_COMMAND` only when cPanel shows a different reload for this application.

Two deploys cannot run at once. GitHub queues the job, and the server holds `.deploy.lock`.

## GitHub secrets

Add these to the repository or to the `production` environment. Do not commit the values.

| Secret | Required | Value |
| --- | --- | --- |
| `PRODUCTION_HOST` | yes | `premium55-5.web-hosting.com` |
| `PRODUCTION_USER` | yes | `neurtqox` |
| `PRODUCTION_SSH_KEY` | yes | Passphrase-protected private key. A public deploy key is not required; the GitHub repo is public. |
| `PRODUCTION_SSH_PASSPHRASE` | yes | Passphrase for that key. It is given to `ssh-add` through `SSH_ASKPASS` and is never written into the remote env file or the logs. |
| `PRODUCTION_PATH` | yes | `/home/neurtqox/apps/bmjmasjid` |
| `PRODUCTION_URL` | yes | `https://bmjmasjid.neuroncosmo.com` |
| `PRODUCTION_KNOWN_HOSTS` | yes | Output of `ssh-keyscan -p 21098 -H premium55-5.web-hosting.com` |
| `PRODUCTION_PORT` | yes | `21098`. If the secret is empty, the script uses `21098`. |
| `PRODUCTION_NODE_SETUP` | yes | `source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate` |
| `PRODUCTION_RESTART_COMMAND` | no | Leave empty. Passenger reloads from `tmp/restart.txt`. |

Create the key on your own machine, not in the repository:

```bash
ssh-keygen -t ed25519 -f bmj-deploy -C "github-actions-bmj"
ssh-keyscan -p 21098 -H premium55-5.web-hosting.com
```

The key already configured for this account is passphrase-protected. Put that passphrase in `PRODUCTION_SSH_PASSPHRASE`. The runner starts a private `ssh-agent`, sets `SSH_ASKPASS_REQUIRE=force`, and loads the key without printing it. After `ssh-add` succeeds, the private key file is deleted and `ssh` is given only the public key, so BatchMode does not ask for the passphrase again. Host checking stays `StrictHostKeyChecking=yes`. Do not put the passphrase in the key file, the workflow, or a log.

Append `bmj-deploy.pub` to `/home/neurtqox/.ssh/authorized_keys`. Put the contents of `bmj-deploy` in `PRODUCTION_SSH_KEY` and the `ssh-keyscan` output in `PRODUCTION_KNOWN_HOSTS`.

Host key fingerprints measured on port 21098, so the scan can be checked before saving it:

- ED25519 `SHA256:VCZceygcfUd5F3DLt2KMYA0LFUymF6koIYf2QtoKQQQ`
- ECDSA `SHA256:ClP7qRGngziwG50+rh5eCSviHw3zv37bU6ELPHYPG24`
- RSA `SHA256:WNwJlODGdvyYgxHcz3v16YlF9j3K65WRpzM+w+4wDas`

## One-time server setup

Do this once on the existing host. Do not recreate the database, replace `.env*`, or edit SSL.

1. The application root is `/home/neurtqox/apps/bmjmasjid`. Passenger watches `tmp/restart.txt` there. It is not `public_html`.
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
6. Add the GitHub secrets above, including `PRODUCTION_SSH_PASSPHRASE`.
7. From a checkout of this branch, with the private key only on your own machine, run the read-only preflight. `read -s` does not echo the passphrase:

```bash
export PRODUCTION_HOST=premium55-5.web-hosting.com
export PRODUCTION_PORT=21098
export PRODUCTION_USER=neurtqox
export PRODUCTION_PATH=/home/neurtqox/apps/bmjmasjid
export PRODUCTION_URL=https://bmjmasjid.neuroncosmo.com
export PRODUCTION_NODE_SETUP='source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate'
export PRODUCTION_KNOWN_HOSTS="$(ssh-keyscan -p 21098 -H premium55-5.web-hosting.com)"
export PRODUCTION_SSH_KEY="$(cat bmj-deploy)"
read -r -s -p "Passphrase: " PRODUCTION_SSH_PASSPHRASE
echo
export PRODUCTION_SSH_PASSPHRASE
PREFLIGHT=1 bash scripts/ci-deploy.sh
unset PRODUCTION_SSH_KEY PRODUCTION_SSH_PASSPHRASE
```

The command must print `preflight_result=ok`. It does not fetch, build, migrate, or touch `tmp/restart.txt`.
8. Merge to `master` only after that result. Then set the repository variable `PRODUCTION_DEPLOY_ENABLED` to `true`. The next push to `master` deploys. `https://bmjmasjid.neuroncosmo.com/api/health` must return the deployed commit. While the variable is unset, a merge does not SSH to the server.

`npm run db:migrate` must succeed with the server's existing `DATABASE_URL`. The migration uses a named lock, skips SQL that was already applied, and refuses an edited migration file. It does not drop, truncate, or reseed tables.

## Logs, live commit, and rollback

- Actions: repository **Actions** tab, workflow **CI**, job **Deploy production**.
- Live commit: `curl -fsS "$PRODUCTION_URL/api/health"` and compare `sha` with the Actions commit. On the server, `cat "$PRODUCTION_PATH/.deployed-sha"`.
- A failed public check checks out the previous commit, reinstalls, migrates, rebuilds, and restarts, then the Actions job stays red.
- Manual rollback: revert on `master` and push, or SSH and run `ROLLBACK_MODE=1 DEPLOY_SHA=<40-char sha> APP_DIR=<PRODUCTION_PATH> bash scripts/deploy-production.sh` from a checkout that contains this script. The SHA must already be on `origin/master`.
- Rollback does not reverse SQL. Migrations are forward-only. The current migration only creates missing tables, so the previous app can still start after it has been applied.

Payment gateway settings stay unused. Do not set SSLCOMMERZ variables as part of deployment.
