#!/usr/bin/env bash
# Reads /tmp/bmj-deploy.env, then runs the deploy script. No secrets are printed.
set -euo pipefail

set -a
# shellcheck disable=SC1091
. /tmp/bmj-deploy.env
set +a
rm -f /tmp/bmj-deploy.env

PRODUCTION_NODE_SETUP=$(printf '%s' "${NODE_B64:-}" | base64 -d)
PRODUCTION_RESTART_COMMAND=$(printf '%s' "${RESTART_B64:-}" | base64 -d)
export PRODUCTION_NODE_SETUP PRODUCTION_RESTART_COMMAND APP_DIR DEPLOY_SHA ROLLBACK_MODE

exec bash /tmp/bmj-deploy-production.sh
