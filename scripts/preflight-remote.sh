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
  # shellcheck disable=SC2086
  eval "$PRODUCTION_NODE_SETUP"
  cd "$APP_DIR"
  unset PRODUCTION_NODE_SETUP NODE_B64
fi

assert_production_checkout

if ! command -v node >/dev/null 2>&1; then
  echo "node is not on PATH after the cPanel activate command" >&2
  exit 1
fi
node_version=$(node -v)

env_names=""
for file in .env .env.local .env.production .env.production.local; do
  if [ -f "$file" ]; then
    env_names="${env_names}${env_names:+,}${file}"
  fi
done

writable=0
if [ -w "$APP_DIR" ]; then
  writable=1
fi

head=$(gitc rev-parse HEAD)
printf '%s\n' "preflight_result=ok"
printf '%s\n' "preflight_head=$head"
printf '%s\n' "preflight_node=$node_version"
printf '%s\n' "preflight_env_files=${env_names:-none}"
printf '%s\n' "preflight_writable=$writable"
printf '%s\n' "preflight_passenger=tmp/restart.txt"
