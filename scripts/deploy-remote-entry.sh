#!/usr/bin/env bash
# Reads deploy.env beside this script, then runs the deploy. No secrets are printed.
set +x
set -euo pipefail

dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
set -a
# shellcheck disable=SC1091
. "$dir/deploy.env"
set +a
rm -f "$dir/deploy.env"

PRODUCTION_NODE_SETUP=$(printf '%s' "${NODE_B64:-}" | base64 -d)
PRODUCTION_RESTART_COMMAND=$(printf '%s' "${RESTART_B64:-}" | base64 -d)
unset NODE_B64 RESTART_B64
export PRODUCTION_NODE_SETUP PRODUCTION_RESTART_COMMAND APP_DIR DEPLOY_SHA ROLLBACK_MODE
export EXPECTED_APP_DIR="${EXPECTED_APP_DIR:-}"

exec bash "$dir/deploy-production.sh"
