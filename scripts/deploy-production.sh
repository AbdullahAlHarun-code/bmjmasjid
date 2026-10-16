#!/usr/bin/env bash
# Deploy one exact commit into the existing production directory.
set +x
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
# shellcheck source=production-checkout-guard.sh
source "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/production-checkout-guard.sh"
assert_production_checkout

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
stage_dir=""
previous=$(gitc rev-parse HEAD)
env_snapshot=$(mktemp)
remove_stage() {
  if [ -z "${stage_dir:-}" ]; then
    return 0
  fi
  if [ -d "$stage_dir" ]; then
    gitc worktree remove --force "$stage_dir" >/dev/null 2>&1 || rm -rf "$stage_dir"
  fi
  stage_dir=""
}
trap 'remove_stage; rm -f "$env_snapshot"' EXIT

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

assert_production_origin() {
  if [ "$APP_DIR" != "/home/neurtqox/apps/bmjmasjid" ]; then
    return 0
  fi
  local remote_url
  remote_url=$(gitc remote get-url origin 2>/dev/null || true)
  case "$remote_url" in
    https://github.com/AbdullahAlHarun-code/bmjmasjid|https://github.com/AbdullahAlHarun-code/bmjmasjid.git|git@github.com:AbdullahAlHarun-code/bmjmasjid.git)
      ;;
    *)
      echo "Refusing to deploy: origin is not the public bmjmasjid repository" >&2
      return 1
      ;;
  esac
}

refuse_tracked_local_changes() {
  local dirty
  dirty=$(gitc status --porcelain --untracked-files=no | grep -v 'src/server/deployed-commit.ts' || true)
  if [ -n "$dirty" ]; then
    echo "Refusing to deploy: the production checkout has tracked local changes." >&2
    printf '%s\n' "$dirty" >&2
    return 1
  fi
}

link_env_into_stage() {
  local file
  for file in .env .env.local .env.production .env.production.local; do
    if [ -f "$APP_DIR/$file" ]; then
      ln -s "$APP_DIR/$file" "$stage_dir/$file"
    fi
  done
}

build_release() {
  local sha="$1"
  local parent avail
  remove_stage
  parent=$(dirname "$APP_DIR")
  if [ ! -w "$parent" ]; then
    parent=${HOME:-/tmp}
  fi
  avail=$(df -Pk "$parent" | awk 'NR==2 { print $4 }')
  if [ -n "${avail:-}" ] && [ "$avail" -lt 512000 ]; then
    echo "Refusing to deploy: less than 500MB free for a staged build ($avail KB)" >&2
    return 1
  fi
  stage_dir=$(mktemp -d "$parent/bmj-stage.XXXXXX")
  rmdir "$stage_dir"
  gitc worktree add --detach "$stage_dir" "$sha"
  link_env_into_stage
  pushd "$stage_dir" >/dev/null
  export npm_config_cache="$stage_dir/npm-cache"
  write_stamp "$sha"
  npm ci
  run_migrate
  npm run build
  assert_env_unchanged
  popd >/dev/null
  unset npm_config_cache
  if [ ! -d "$stage_dir/node_modules" ] || [ ! -d "$stage_dir/.next" ]; then
    echo "Staged build did not produce node_modules and .next" >&2
    return 1
  fi
}

publish_tree() {
  local sha="$1"
  cd "$APP_DIR"
  switched=1
  gitc checkout -f --detach "$sha"
  rm -rf "$APP_DIR/node_modules" "$APP_DIR/.next"
  mv "$stage_dir/node_modules" "$APP_DIR/node_modules"
  mv "$stage_dir/.next" "$APP_DIR/.next"
  write_stamp "$sha"
  assert_env_unchanged
  restart_app
  printf '%s\n' "$sha" > "$APP_DIR/.deployed-sha"
  switched=0
}

restore_previous() {
  echo "Restoring previous commit $previous" >&2
  build_release "$previous"
  publish_tree "$previous"
  remove_stage
}

on_error() {
  local status=$?
  trap - ERR
  cd "$APP_DIR" || true
  echo "deploy_result=failed"
  echo "deploy_previous_sha=$previous"
  if [ "$ROLLBACK_MODE" = 1 ] || [ "$switched" != 1 ]; then
    remove_stage
    exit "$status"
  fi
  remove_stage
  switched=0
  restore_previous || echo "Automatic restore failed. Previous commit was $previous" >&2
  exit "$status"
}
trap on_error ERR

snapshot_env
assert_env_unchanged
assert_production_origin

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

refuse_tracked_local_changes
build_release "$DEPLOY_SHA"
assert_env_unchanged
publish_tree "$DEPLOY_SHA"
remove_stage

echo "deploy_result=deployed"
echo "deploy_sha=$DEPLOY_SHA"
echo "deploy_previous_sha=$previous"
