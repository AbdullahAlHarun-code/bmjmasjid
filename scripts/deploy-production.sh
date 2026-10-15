#!/usr/bin/env bash
# Deploy one exact commit into the existing production directory.
# Invoked over SSH by GitHub Actions. Does not print or replace secrets.
set -euo pipefail

APP_DIR=${APP_DIR:?APP_DIR is required}
DEPLOY_SHA=${DEPLOY_SHA:?DEPLOY_SHA is required}
ROLLBACK_MODE=${ROLLBACK_MODE:-0}
export APP_DIR

if [ ! -d "$APP_DIR" ]; then
  echo "Production directory does not exist: $APP_DIR" >&2
  exit 1
fi
case "$APP_DIR" in
  /*) ;;
  *) echo "APP_DIR must be an absolute path" >&2; exit 1 ;;
esac
case "$APP_DIR" in
  *[!A-Za-z0-9/_.-]*) echo "APP_DIR contains unsupported characters" >&2; exit 1 ;;
esac
if [ "$ROLLBACK_MODE" != 0 ] && [ "$ROLLBACK_MODE" != 1 ]; then
  echo "ROLLBACK_MODE must be 0 or 1" >&2
  exit 1
fi
if ! printf '%s' "$DEPLOY_SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "DEPLOY_SHA must be a 40-character git commit" >&2
  exit 1
fi

cd "$APP_DIR"
gitc() { command git -c safe.directory="$APP_DIR" "$@"; }

if ! gitc rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "APP_DIR is not a git checkout. Finish the one-time server setup in docs/deployment.md." >&2
  exit 1
fi

exec 9> .deploy.lock
if ! flock -w 1800 9; then
  echo "Timed out waiting for another production deploy to finish" >&2
  exit 1
fi

if [ -n "${PRODUCTION_NODE_SETUP:-}" ]; then
  # Activates the existing cPanel nodevenv. The selector command may cd; return afterwards.
  eval "$PRODUCTION_NODE_SETUP"
  cd "$APP_DIR"
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "node and npm must be on PATH for non-interactive SSH. Set PRODUCTION_NODE_SETUP if cPanel isolates Node." >&2
  exit 1
fi
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 20 || (major === 20 && minor < 9)) { console.error("Node.js 20.9 or newer is required, 22 preferred"); process.exit(1); }'

switched=0
previous=$(gitc rev-parse HEAD)
env_snapshot=$(mktemp)
trap 'rm -f "$env_snapshot"' EXIT

hash_file() {
  node -e 'const {createHash}=require("node:crypto"); const {readFileSync}=require("node:fs"); process.stdout.write(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"));' "$1"
}

snapshot_env() {
  : > "$env_snapshot"
  local file
  for file in .env .env.local .env.production .env.production.local; do
    if [ -f "$file" ]; then
      printf '%s %s\n' "$file" "$(hash_file "$file")" >> "$env_snapshot"
    elif [ -e "$file" ]; then
      echo "Refusing to deploy: $file exists but is not a regular file" >&2
      return 1
    fi
  done
}

assert_env_unchanged() {
  local now file
  now=$(mktemp)
  : > "$now"
  for file in .env .env.local .env.production .env.production.local; do
    if [ -f "$file" ]; then
      printf '%s %s\n' "$file" "$(hash_file "$file")" >> "$now"
    fi
  done
  if ! cmp -s "$env_snapshot" "$now"; then
    rm -f "$now"
    echo "Deploy changed an environment file. Stopping." >&2
    return 1
  fi
  rm -f "$now"
}

write_stamp() {
  local sha="$1"
  mkdir -p src/server
  cat > src/server/deployed-commit.ts <<EOF
/** Build stamp written by scripts/deploy-production.sh. Not a secret. */
export const deployedCommit = "${sha}";
EOF
}

run_migrate() {
  local -a env_args=()
  local file
  for file in .env .env.production .env.local .env.production.local; do
    if [ -f "$file" ]; then
      env_args+=(--env-file="$file")
    fi
  done
  node "${env_args[@]}" scripts/db-migrate.mjs
}

restart_app() {
  if [ -n "${PRODUCTION_RESTART_COMMAND:-}" ]; then
    bash -c "$PRODUCTION_RESTART_COMMAND"
    return
  fi
  # Namecheap shared hosting runs this app under cPanel's Node.js selector
  # (Phusion Passenger). Passenger reloads when tmp/restart.txt in the
  # application root changes. A stray pm2 binary must not take this path.
  mkdir -p "$APP_DIR/tmp"
  touch "$APP_DIR/tmp/restart.txt"
}

restore_previous() {
  echo "Restoring previous commit $previous" >&2
  gitc checkout -f --detach "$previous"
  write_stamp "$previous"
  npm ci
  run_migrate
  npm run build
  restart_app
  printf '%s\n' "$previous" > .deployed-sha
  assert_env_unchanged
}

on_error() {
  local status=$?
  trap - ERR
  echo "deploy_result=failed"
  echo "deploy_previous_sha=$previous"
  if [ "$ROLLBACK_MODE" = 1 ] || [ "$switched" != 1 ]; then
    exit "$status"
  fi
  switched=0
  restore_previous || echo "Automatic restore failed. Previous commit was $previous" >&2
  exit "$status"
}
trap on_error ERR

snapshot_env
assert_env_unchanged

if [ -f .git/shallow ]; then
  gitc fetch --unshallow origin
fi
gitc fetch --no-tags origin master
if ! gitc cat-file -e "${DEPLOY_SHA}^{commit}" >/dev/null 2>&1; then
  gitc fetch --no-tags origin "$DEPLOY_SHA"
fi
if ! gitc cat-file -e "${DEPLOY_SHA}^{commit}" >/dev/null 2>&1; then
  echo "Commit $DEPLOY_SHA is not available from origin" >&2
  exit 1
fi
if ! gitc merge-base --is-ancestor "$DEPLOY_SHA" origin/master; then
  echo "Refusing $DEPLOY_SHA because it is not on origin/master" >&2
  exit 1
fi

tip=$(gitc rev-parse origin/master)
if [ "$ROLLBACK_MODE" != 1 ] && [ "$tip" != "$DEPLOY_SHA" ]; then
  echo "deploy_result=skipped"
  echo "deploy_sha=$DEPLOY_SHA"
  echo "deploy_previous_sha=$previous"
  echo "Skipping $DEPLOY_SHA because origin/master is $tip"
  exit 0
fi

gitc checkout -f --detach "$DEPLOY_SHA"
switched=1
assert_env_unchanged
write_stamp "$DEPLOY_SHA"

npm ci
run_migrate
assert_env_unchanged
npm run build
assert_env_unchanged
restart_app
printf '%s\n' "$DEPLOY_SHA" > .deployed-sha
switched=0

echo "deploy_result=deployed"
echo "deploy_sha=$DEPLOY_SHA"
echo "deploy_previous_sha=$previous"
