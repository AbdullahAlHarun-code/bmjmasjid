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
bash -n "$root/scripts/preflight-remote.sh"
bash -n "$root/scripts/production-checkout-guard.sh"
bash -n "$root/scripts/ssh-load-key.sh"

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
if ! grep -q 'PRODUCTION_SSH_PASSPHRASE' /tmp/bmj-ci-deploy.err; then
  echo "missing-secret error did not name PRODUCTION_SSH_PASSPHRASE" >&2
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
mkdir -p node_modules .next
if [ "\$1" = "run" ] && [ "\$2" = "build" ]; then
  printf '%s\n' built-by-npm > .next/marker
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
grep -q '^built-by-npm$' "$tmp/app/.next/marker"
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
printf '%s\n' keep-old > "$tmp/app/.next/marker"
export FAIL_NEXT_BUILD=1
if run_deploy "$tmp/fail.out" DEPLOY_SHA="$sha_c"; then
  echo "failed build should fail the deploy" >&2
  exit 1
fi
unset FAIL_NEXT_BUILD
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_b"
grep -q '^keep-old$' "$tmp/app/.next/marker"

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
run_deploy "$tmp/passenger.out" DEPLOY_SHA="$sha_c" PRODUCTION_NODE_SETUP="printf '%s' \"\$CL_VIRTUAL_ENV\"; cd '$tmp/elsewhere'"
grep -q '^deploy_result=deployed$' "$tmp/passenger.out"
test -f "$tmp/app/tmp/restart.txt"
test ! -e "$tmp/elsewhere/tmp"
test ! -e "$tmp/pm2-called"
test "$(git -C "$tmp/app" rev-parse HEAD)" = "$sha_c"
grep -q 'super-secret-db-token' "$tmp/app/.env.local"

printf 'upload-keep-7f3c\n' > "$tmp/app/upload-keep.txt"
mkdir -p "$tmp/app/tmp"
touch "$tmp/app/tmp/restart.txt"
restart_before=$(stat -c %Y "$tmp/app/tmp/restart.txt")
pf=$(mktemp -d)
cp "$root/scripts/preflight-remote.sh" "$root/scripts/production-checkout-guard.sh" "$pf/"
cat > "$pf/deploy.env" <<EOF
APP_DIR=$tmp/app
EXPECTED_APP_DIR=$tmp/app
NODE_B64=
ROLLBACK_MODE=0
DEPLOY_SHA=
EOF
bash "$pf/preflight-remote.sh" >"$tmp/preflight.out"
grep -q '^preflight_result=ok$' "$tmp/preflight.out"
grep -q 'upload-keep-7f3c' "$tmp/app/upload-keep.txt"
test "$(stat -c %Y "$tmp/app/tmp/restart.txt")" = "$restart_before"
test ! -e "$pf/deploy.env"

mkdir -p "$tmp/app/nested"
cat > "$pf/deploy.env" <<EOF
APP_DIR=$tmp/app/nested
EXPECTED_APP_DIR=$tmp/app/nested
NODE_B64=
EOF
if bash "$pf/preflight-remote.sh" >"$tmp/nested-pre.out" 2>"$tmp/nested-pre.err"; then
  echo "subdirectory preflight should fail" >&2
  exit 1
fi
grep -q 'not the git work tree root' "$tmp/nested-pre.err"

run_deploy "$tmp/keep.out" DEPLOY_SHA="$sha_c"
grep -q '^deploy_result=deployed$' "$tmp/keep.out"
grep -q 'upload-keep-7f3c' "$tmp/app/upload-keep.txt"

git -C "$tmp/app" config --unset-all remote.origin.fetch
git -C "$tmp/app" update-ref -d refs/remotes/origin/master
run_deploy "$tmp/refspec.out" DEPLOY_SHA="$sha_c"
grep -q '^deploy_result=deployed$' "$tmp/refspec.out"
test "$(git -C "$tmp/app" rev-parse refs/remotes/origin/master)" = "$sha_c"

printf '\n%s\n' '// local-only' >> "$tmp/app/scripts/db-migrate.mjs"
if run_deploy "$tmp/dirty.out" DEPLOY_SHA="$sha_c"; then
  echo "tracked local changes should be refused" >&2
  exit 1
fi
grep -q 'tracked local changes' "$tmp/dirty.out.err"
git -C "$tmp/app" checkout -f -- scripts/db-migrate.mjs

printf 'db-password-keep\n' > "$tmp/app/.env.production"
git -C "$tmp/app" add .env.production
git -C "$tmp/app" -c user.email=deploy-test@example.com -c user.name='Deploy Test' commit -m 'track env' >/dev/null
sha_tracked=$(git -C "$tmp/app" rev-parse HEAD)
if APP_DIR="$tmp/app" DEPLOY_SHA="$sha_tracked" bash "$deploy" >"$tmp/tracked.out" 2>"$tmp/tracked.err"; then
  echo "tracked env file should fail before checkout" >&2
  exit 1
fi
grep -q 'is tracked' "$tmp/tracked.err"
grep -q 'db-password-keep' "$tmp/app/.env.production"
if grep -F -q 'db-password-keep' "$tmp/tracked.out" "$tmp/tracked.err"; then
  echo "deploy printed the env file" >&2
  exit 1
fi

if grep -nE 'git[[:space:]]+clean|gitc[[:space:]]+clean' "$deploy" "$root/scripts/preflight-remote.sh"; then
  echo "production scripts must not git clean" >&2
  exit 1
fi
if grep -n 'StrictHostKeyChecking=no\|StrictHostKeyChecking=accept-new' "$ci_deploy"; then
  echo "host verification must stay enabled" >&2
  exit 1
fi
grep -q 'StrictHostKeyChecking=yes' "$ci_deploy"
grep -q 'PRODUCTION_DEPLOY_ENABLED' "$root/.github/workflows/ci.yml"
grep -q "inputs.action == 'preflight'" "$root/.github/workflows/ci.yml"
if grep -n 'PASSPHRASE' "$deploy" "$root/scripts/preflight-remote.sh" "$root/scripts/deploy-remote-entry.sh" "$root/scripts/production-checkout-guard.sh"; then
  echo "remote scripts must not reference the passphrase" >&2
  exit 1
fi

phrase='pass'"'"'word $("x") 9f3a'
wrong_phrase='wrong-passphrase-9f3a'
kdir=$(mktemp -d)
ssh-keygen -q -t ed25519 -f "$kdir/key" -N "$phrase" -C "bmj-test"
key=$(cat "$kdir/key")
ssh_log="$tmp/ssh-calls"
: > "$ssh_log"
cat > "$bin/ssh" <<EOF
#!/bin/sh
printf '%s\n' "\$*" >> "$ssh_log"
exit 99
EOF
cat > "$bin/scp" <<EOF
#!/bin/sh
printf '%s\n' "\$*" >> "$ssh_log"
exit 99
EOF
chmod +x "$bin/ssh" "$bin/scp"

assert_no_secret() {
  local file
  for file in "$@"; do
    if [ -f "$file" ] && grep -F -q "$phrase" "$file"; then
      echo "output contained the test passphrase: $file" >&2
      exit 1
    fi
    if [ -f "$file" ] && grep -F -q "$wrong_phrase" "$file"; then
      echo "output contained the wrong passphrase: $file" >&2
      exit 1
    fi
    if [ -f "$file" ] && grep -F -q 'PRIVATE KEY' "$file"; then
      echo "output contained key material: $file" >&2
      exit 1
    fi
  done
}

set +e
env -u SSH_AUTH_SOCK -u SSH_AGENT_PID PATH="$bin:$PATH" \
  PRODUCTION_HOST=evil.example \
  PRODUCTION_USER=neurtqox \
  PRODUCTION_PORT=21098 \
  PRODUCTION_PATH=/home/neurtqox/apps/bmjmasjid \
  PRODUCTION_URL=https://bmjmasjid.neuroncosmo.com \
  PRODUCTION_NODE_SETUP='source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate' \
  PRODUCTION_KNOWN_HOSTS=placeholder \
  PRODUCTION_SSH_KEY="$key" \
  PRODUCTION_SSH_PASSPHRASE="$phrase" \
  PREFLIGHT=1 \
  bash "$ci_deploy" >"$tmp/wrong-host.out" 2>"$tmp/wrong-host.err"
wrong_host_status=$?
set -e
test "$wrong_host_status" -ne 0
grep -q 'confirmed Namecheap SSH host' "$tmp/wrong-host.err"
test ! -s "$ssh_log"
assert_no_secret "$tmp/wrong-host.out" "$tmp/wrong-host.err" "$ssh_log"

: > "$ssh_log"
set +e
env -u SSH_AUTH_SOCK -u SSH_AGENT_PID PATH="$bin:$PATH" \
  PRODUCTION_HOST=premium55-5.web-hosting.com \
  PRODUCTION_USER=neurtqox \
  PRODUCTION_PORT=21098 \
  PRODUCTION_PATH=/home/neurtqox/apps/bmjmasjid \
  PRODUCTION_URL=https://bmjmasjid.neuroncosmo.com \
  PRODUCTION_NODE_SETUP='source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate' \
  PRODUCTION_KNOWN_HOSTS=placeholder \
  PRODUCTION_SSH_KEY="$key" \
  PRODUCTION_SSH_PASSPHRASE="$wrong_phrase" \
  PREFLIGHT=1 \
  bash "$ci_deploy" >"$tmp/bad-pass.out" 2>"$tmp/bad-pass.err"
bad_pass_status=$?
set -e
test "$bad_pass_status" -ne 0
grep -q 'did not unlock' "$tmp/bad-pass.err"
test ! -s "$ssh_log"
assert_no_secret "$tmp/bad-pass.out" "$tmp/bad-pass.err" "$ssh_log"

(
  unset SSH_AUTH_SOCK SSH_AGENT_PID
  trap 'if [ -n "${SSH_AGENT_PID:-}" ]; then ssh-agent -k >/dev/null 2>&1 || true; fi' EXIT
  # shellcheck source=ssh-load-key.sh
  source "$root/scripts/ssh-load-key.sh"
  export PRODUCTION_SSH_KEY="$key"
  export PRODUCTION_SSH_PASSPHRASE="$phrase"
  load_ssh_key "$kdir/work"
  test -z "${PRODUCTION_SSH_PASSPHRASE:-}"
  test "$(stat -c %a "$kdir/work/askpass")" = "700"
  if grep -F -q "$phrase" "$kdir/work/askpass"; then
    echo "askpass script stored the passphrase" >&2
    exit 1
  fi
  ssh-add -l | grep -q 'bmj-test'
  test ! -e "$kdir/work/id"
  test -f "$kdir/work/id.pub"
  if env | grep -F -q "$phrase"; then
    echo "passphrase remained in the environment" >&2
    exit 1
  fi
) >"$kdir/load.out" 2>"$kdir/load.err"
assert_no_secret "$kdir/load.out" "$kdir/load.err"

: > "$ssh_log"
set +e
env -u SSH_AUTH_SOCK -u SSH_AGENT_PID PATH="$bin:$PATH" \
  PRODUCTION_HOST=premium55-5.web-hosting.com \
  PRODUCTION_USER=neurtqox \
  PRODUCTION_PORT=21098 \
  PRODUCTION_PATH=/home/neurtqox/apps/bmjmasjid \
  PRODUCTION_URL=https://bmjmasjid.neuroncosmo.com \
  PRODUCTION_NODE_SETUP='source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate' \
  PRODUCTION_KNOWN_HOSTS=placeholder \
  PRODUCTION_SSH_KEY="$key" \
  PRODUCTION_SSH_PASSPHRASE="$phrase" \
  PREFLIGHT=1 \
  bash "$ci_deploy" >"$tmp/good-pass.out" 2>"$tmp/good-pass.err"
good_pass_status=$?
set -e
test "$good_pass_status" -ne 0
test -s "$ssh_log"
grep -q -- '-o StrictHostKeyChecking=yes' "$ssh_log"
grep -q -- '-o ForwardAgent=no' "$ssh_log"
grep -E -q -- '-i [^ ]+\.pub( |$)' "$ssh_log"
if grep -E -q -- '-i [^ ]+/id( |$)' "$ssh_log"; then
  echo "ssh was given the encrypted private key file" >&2
  exit 1
fi
assert_no_secret "$tmp/good-pass.out" "$tmp/good-pass.err" "$ssh_log"

echo "deploy guards passed"
