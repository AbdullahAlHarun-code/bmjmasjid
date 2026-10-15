#!/usr/bin/env bash
# Hermetic checks for production deploy guards. No network and no real server.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
deploy="$root/scripts/deploy-production.sh"
ci_deploy="$root/scripts/ci-deploy.sh"

bash -n "$deploy"
bash -n "$ci_deploy"
bash -n "$root/scripts/ci-health.sh"
bash -n "$root/scripts/deploy-remote-entry.sh"

if PRODUCTION_URL=http://example.com EXPECTED_SHA=0123456789abcdef0123456789abcdef01234567 bash "$root/scripts/ci-health.sh" >/tmp/bmj-health-http.out 2>/tmp/bmj-health-http.err; then
  echo "http health check should fail" >&2
  exit 1
fi
if ! grep -q 'non-HTTPS' /tmp/bmj-health-http.err; then
  echo "http health check did not explain the refusal" >&2
  cat /tmp/bmj-health-http.err >&2
  exit 1
fi

if GITHUB_SHA=abc bash "$ci_deploy" >/tmp/bmj-ci-deploy.out 2>/tmp/bmj-ci-deploy.err; then
  echo "ci deploy should fail without secrets" >&2
  exit 1
fi
if ! grep -q 'PRODUCTION_HOST' /tmp/bmj-ci-deploy.err; then
  echo "missing-secret error did not name PRODUCTION_HOST" >&2
  cat /tmp/bmj-ci-deploy.err >&2
  exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
bin="$tmp/bin"
mkdir -p "$bin"
npm_log="$tmp/npm.log"
cat > "$bin/npm" <<EOF
#!/bin/sh
echo "\$*" >> "$npm_log"
if [ "\${FAIL_NEXT_BUILD:-}" = 1 ] && [ "\$1" = "run" ] && [ "\$2" = "build" ]; then
  exit 1
fi
exit 0
EOF
chmod +x "$bin/npm"

git init --bare "$tmp/origin.git" >/dev/null
git clone "$tmp/origin.git" "$tmp/app" >/dev/null
git -C "$tmp/app" checkout -b master >/dev/null
mkdir -p "$tmp/app/src/server" "$tmp/app/scripts"
cat > "$tmp/app/src/server/deployed-commit.ts" <<'EOF'
/** Build stamp written by scripts/deploy-production.sh. Not a secret. */
export const deployedCommit = "not-a-production-deploy";
EOF
cat > "$tmp/app/scripts/db-migrate.mjs" <<'EOF'
console.log("migrate-ok");
EOF
printf '%s\n' 'super-secret-db-token' > "$tmp/app/.env.local"
git -C "$tmp/app" add src scripts
git -C "$tmp/app" -c user.email=deploy-test@example.com -c user.name='Deploy Test' commit -m 'initial' >/dev/null
git -C "$tmp/app" push -u origin master >/dev/null
sha_a=$(git -C "$tmp/app" rev-parse HEAD)

export PATH="$bin:$PATH"
run_deploy() {
  local log="$1"
  shift
  set +e
  env APP_DIR="$tmp/app" "$@" bash "$deploy" >"$log" 2>"$log.err"
  status=$?
  set -e
  cat "$log" "$log.err"
  return "$status"
}

run_deploy "$tmp/a.out" DEPLOY_SHA="$sha_a"
grep -q '^deploy_result=deployed$' "$tmp/a.out"
grep -q "$sha_a" "$tmp/app/src/server/deployed-commit.ts"
grep -q '^ci$' "$npm_log"
grep -q '^run build$' "$npm_log"
test -f "$tmp/app/tmp/restart.txt"
grep -q 'super-secret-db-token' "$tmp/app/.env.local"
if grep -q 'super-secret-db-token' "$tmp/a.out" || grep -q 'super-secret-db-token' "$tmp/a.out.err"; then
  echo "deploy output leaked the env file" >&2
  exit 1
fi
before=$(sha256sum "$tmp/app/.env.local")

git -C "$tmp/app" checkout -f master >/dev/null
printf '\n%s\n' '// second' >> "$tmp/app/scripts/db-migrate.mjs"
git -C "$tmp/app" add scripts/db-migrate.mjs
git -C "$tmp/app" -c user.email=deploy-test@example.com -c user.name='Deploy Test' commit -m 'second' >/dev/null
git -C "$tmp/app" push origin master >/dev/null
sha_b=$(git -C "$tmp/app" rev-parse HEAD)

stamp_before=$(cat "$tmp/app/src/server/deployed-commit.ts")
if run_deploy "$tmp/skip.out" DEPLOY_SHA="$sha_a"; then
  grep -q '^deploy_result=skipped$' "$tmp/skip.out"
else
  echo "older sha should skip" >&2
  exit 1
fi
test "$(cat "$tmp/app/src/server/deployed-commit.ts")" = "$stamp_before"
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_b"

: > "$npm_log"
run_deploy "$tmp/b.out" DEPLOY_SHA="$sha_b"
grep -q '^deploy_result=deployed$' "$tmp/b.out"
grep -q "$sha_b" "$tmp/app/src/server/deployed-commit.ts"
after=$(sha256sum "$tmp/app/.env.local")
test "$before" = "$after"

git -C "$tmp/app" checkout -f -b side >/dev/null
printf '\n%s\n' '// side' >> "$tmp/app/scripts/db-migrate.mjs"
git -C "$tmp/app" add scripts/db-migrate.mjs
git -C "$tmp/app" -c user.email=deploy-test@example.com -c user.name='Deploy Test' commit -m 'side' >/dev/null
sha_side=$(git -C "$tmp/app" rev-parse HEAD)
git -C "$tmp/app" push origin side >/dev/null
git -C "$tmp/app" checkout -f master >/dev/null
if run_deploy "$tmp/side.out" DEPLOY_SHA="$sha_side"; then
  echo "side commit should be refused" >&2
  exit 1
fi
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_b"

git -C "$tmp/app" checkout -f master >/dev/null
printf '\n%s\n' '// third' >> "$tmp/app/scripts/db-migrate.mjs"
git -C "$tmp/app" add scripts/db-migrate.mjs
git -C "$tmp/app" -c user.email=deploy-test@example.com -c user.name='Deploy Test' commit -m 'third' >/dev/null
git -C "$tmp/app" push origin master >/dev/null
sha_c=$(git -C "$tmp/app" rev-parse HEAD)
git -C "$tmp/app" checkout -f --detach "$sha_b" >/dev/null
export FAIL_NEXT_BUILD=1
if run_deploy "$tmp/fail.out" DEPLOY_SHA="$sha_c"; then
  echo "failed build should fail the deploy" >&2
  exit 1
fi
unset FAIL_NEXT_BUILD
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_b"

run_deploy "$tmp/rollback.out" ROLLBACK_MODE=1 DEPLOY_SHA="$sha_a"
grep -q '^deploy_result=deployed$' "$tmp/rollback.out"
grep -q "$sha_a" "$tmp/app/src/server/deployed-commit.ts"
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_a"

mkdir -p "$tmp/not-a-repo"
if APP_DIR="$tmp/not-a-repo" DEPLOY_SHA="$sha_a" bash "$deploy" >"$tmp/nogit.out" 2>&1; then
  echo "non-git directory should fail" >&2
  exit 1
fi
grep -q 'not a git checkout' "$tmp/nogit.out"

if ! grep -F 'PRODUCTION_PORT=${PRODUCTION_PORT:-21098}' "$ci_deploy" >/dev/null; then
  echo "ci deploy must default to the Namecheap SSH port 21098" >&2
  exit 1
fi
if ! grep -F 'ConnectTimeout=20' "$ci_deploy" >/dev/null; then
  echo "ci deploy must fail fast when the SSH port does not connect" >&2
  exit 1
fi

cat > "$bin/pm2" <<EOF
#!/bin/sh
echo called >> "$tmp/pm2-called"
exit 0
EOF
chmod +x "$bin/pm2"
rm -f "$tmp/app/tmp/restart.txt" "$tmp/pm2-called"
mkdir -p "$tmp/elsewhere"
run_deploy "$tmp/passenger.out" DEPLOY_SHA="$sha_c" PRODUCTION_NODE_SETUP="cd '$tmp/elsewhere'"
grep -q '^deploy_result=deployed$' "$tmp/passenger.out"
test -f "$tmp/app/tmp/restart.txt"
test ! -e "$tmp/elsewhere/tmp"
test ! -e "$tmp/pm2-called"
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_c"
grep -q 'super-secret-db-token' "$tmp/app/.env.local"

echo "deploy guards passed"
