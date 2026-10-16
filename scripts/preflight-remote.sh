#!/usr/bin/env bash
# Read-only check of the production checkout. Does not fetch, build, migrate, or restart.
set +x
set -euo pipefail

dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
set -a
# shellcheck disable=SC1091
. "$dir/deploy.env"
set +a
rm -f "$dir/deploy.env"

# shellcheck source=production-checkout-guard.sh
source "$dir/production-checkout-guard.sh"

APP_DIR=${APP_DIR:?APP_DIR is required}
export APP_DIR
cd "$APP_DIR"
gitc() { command git -c safe.directory="$APP_DIR" "$@"; }

if [ -n "${NODE_B64:-}" ]; then
  PRODUCTION_NODE_SETUP=$(printf '%s' "$NODE_B64" | base64 -d)
  # cPanel's activate script reads CL_VIRTUAL_ENV before setting it.
  set +u
  eval "$PRODUCTION_NODE_SETUP"
  set -u
  cd "$APP_DIR"
  unset PRODUCTION_NODE_SETUP NODE_B64
fi

assert_production_checkout

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "node and npm are not on PATH after the cPanel activate command" >&2
  exit 1
fi
node_version=$(node -v)
npm_version=$(npm -v)

env_names=""
env_args=()
for file in .env .env.production .env.local .env.production.local; do
  if [ -f "$file" ]; then
    env_names="${env_names}${env_names:+,}${file}"
    env_args+=(--env-file="$file")
  fi
done

database_url=missing
if [ "${#env_args[@]}" -gt 0 ]; then
  set +e
  node "${env_args[@]}" -e 'const value = process.env.DATABASE_URL || ""; process.exit(value.startsWith("mysql://") ? 0 : 1);' >/dev/null 2>&1
  if [ "$?" -eq 0 ]; then
    database_url=present
  fi
  set -e
fi

if [ "$APP_DIR" = "/home/neurtqox/apps/bmjmasjid" ]; then
  remote_url=$(gitc remote get-url origin 2>/dev/null || true)
  case "$remote_url" in
    https://github.com/AbdullahAlHarun-code/bmjmasjid|https://github.com/AbdullahAlHarun-code/bmjmasjid.git|git@github.com:AbdullahAlHarun-code/bmjmasjid.git)
      ;;
    *)
      echo "Refusing preflight: origin is not the public bmjmasjid repository" >&2
      exit 1
      ;;
  esac
fi
remote_url=$(gitc remote get-url origin 2>/dev/null || true)
case "$remote_url" in
  https://github.com/AbdullahAlHarun-code/bmjmasjid|https://github.com/AbdullahAlHarun-code/bmjmasjid.git|git@github.com:AbdullahAlHarun-code/bmjmasjid.git)
    remote_state=ok
    ;;
  *)
    remote_state=mismatch
    ;;
esac

writable=0
if [ -w "$APP_DIR" ]; then
  writable=1
fi

startup=none
for file in app.js server.js; do
  if [ -f "$file" ]; then
    startup=$file
    break
  fi
done

restart_file=absent
if [ -f tmp/restart.txt ]; then
  restart_file=present
elif [ -e tmp/restart.txt ]; then
  restart_file=not-a-file
fi

disk_kb=$(df -Pk "$APP_DIR" | awk 'NR==2 { print $4 }')
tracked_changes=$(gitc status --porcelain --untracked-files=no | grep -c -v 'src/server/deployed-commit.ts' || true)

head=$(gitc rev-parse HEAD)
printf '%s\n' "preflight_result=ok"
printf '%s\n' "preflight_head=$head"
printf '%s\n' "preflight_node=$node_version"
printf '%s\n' "preflight_npm=$npm_version"
printf '%s\n' "preflight_env_files=${env_names:-none}"
printf '%s\n' "preflight_database_url=$database_url"
printf '%s\n' "preflight_remote=$remote_state"
printf '%s\n' "preflight_writable=$writable"
printf '%s\n' "preflight_startup=$startup"
printf '%s\n' "preflight_restart_file=$restart_file"
printf '%s\n' "preflight_disk_kb=${disk_kb:-unknown}"
printf '%s\n' "preflight_tracked_changes=${tracked_changes:-0}"
printf '%s\n' "preflight_passenger=tmp/restart.txt"
