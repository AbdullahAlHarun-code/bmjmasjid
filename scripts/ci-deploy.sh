#!/usr/bin/env bash
# Runner-side SSH deploy. Secret values are never printed.
set -euo pipefail

require() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    missing+=("$name")
  fi
}

missing=()
require PRODUCTION_HOST
require PRODUCTION_USER
require PRODUCTION_SSH_KEY
require PRODUCTION_PATH
require PRODUCTION_URL
require PRODUCTION_KNOWN_HOSTS
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing GitHub Actions secrets: ${missing[*]}" >&2
  echo "Add them to the repository or the production environment, then rerun the workflow." >&2
  exit 1
fi

PRODUCTION_PORT=${PRODUCTION_PORT:-22}
ROLLBACK_MODE=${ROLLBACK_MODE:-0}
case "$PRODUCTION_PORT" in
  ''|*[!0-9]*) echo "PRODUCTION_PORT must be a number" >&2; exit 1 ;;
esac
case "$ROLLBACK_MODE" in
  0|1) ;;
  *) echo "ROLLBACK_MODE must be 0 or 1" >&2; exit 1 ;;
esac
case "$PRODUCTION_HOST" in
  ''|*[!A-Za-z0-9.-]*) echo "PRODUCTION_HOST contains unsupported characters" >&2; exit 1 ;;
esac
case "$PRODUCTION_USER" in
  ''|*[!A-Za-z0-9._-]*) echo "PRODUCTION_USER contains unsupported characters" >&2; exit 1 ;;
esac
case "$PRODUCTION_PATH" in
  /*) ;;
  *) echo "PRODUCTION_PATH must be an absolute path" >&2; exit 1 ;;
esac
case "$PRODUCTION_PATH" in
  *[!A-Za-z0-9/_.-]*) echo "PRODUCTION_PATH contains unsupported characters" >&2; exit 1 ;;
esac
if ! printf '%s' "$GITHUB_SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "GITHUB_SHA must be a 40-character commit" >&2
  exit 1
fi

production_url=$(PRODUCTION_URL="$PRODUCTION_URL" python3 - <<'PY'
import os
import sys
from urllib.parse import urlparse

url = os.environ["PRODUCTION_URL"].strip().rstrip("/")
parsed = urlparse(url)
if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
    sys.exit("PRODUCTION_URL must be the existing https origin, without credentials or a query string")
if parsed.path not in ("", "/"):
    sys.exit("PRODUCTION_URL must be an origin, not a deep path")
print(url)
PY
)

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
umask 077

write_secret_file() {
  local dest="$1"
  local value="$2"
  printf '%s' "$value" | sed 's/\r$//' > "$dest"
  if ! grep -q $'\n' "$dest" && grep -q '\\n' "$dest"; then
    sed 's/\\n/\n/g' "$dest" > "$dest.expanded"
    mv "$dest.expanded" "$dest"
  fi
  printf '\n' >> "$dest"
  chmod 600 "$dest"
}

write_secret_file "$work/id" "$PRODUCTION_SSH_KEY"
write_secret_file "$work/known_hosts" "$PRODUCTION_KNOWN_HOSTS"

node_b64=$(printf '%s' "${PRODUCTION_NODE_SETUP:-}" | base64 -w0)
restart_b64=$(printf '%s' "${PRODUCTION_RESTART_COMMAND:-}" | base64 -w0)
cat > "$work/deploy.env" <<EOF
DEPLOY_SHA=$GITHUB_SHA
APP_DIR=$PRODUCTION_PATH
ROLLBACK_MODE=$ROLLBACK_MODE
NODE_B64=$node_b64
RESTART_B64=$restart_b64
EOF
chmod 600 "$work/deploy.env"

ssh_opts=(
  -i "$work/id"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="$work/known_hosts"
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=40
)

remote="${PRODUCTION_USER}@${PRODUCTION_HOST}"
scp "${ssh_opts[@]}" -P "$PRODUCTION_PORT" \
  scripts/deploy-production.sh "${remote}:/tmp/bmj-deploy-production.sh"
scp "${ssh_opts[@]}" -P "$PRODUCTION_PORT" \
  scripts/deploy-remote-entry.sh "${remote}:/tmp/bmj-deploy-remote-entry.sh"
scp "${ssh_opts[@]}" -P "$PRODUCTION_PORT" \
  "$work/deploy.env" "${remote}:/tmp/bmj-deploy.env"

set +e
ssh "${ssh_opts[@]}" -p "$PRODUCTION_PORT" "$remote" \
  "chmod 700 /tmp/bmj-deploy-production.sh /tmp/bmj-deploy-remote-entry.sh /tmp/bmj-deploy.env && bash /tmp/bmj-deploy-remote-entry.sh; status=\$?; rm -f /tmp/bmj-deploy-production.sh /tmp/bmj-deploy-remote-entry.sh /tmp/bmj-deploy.env; exit \$status" \
  | tee "$work/output"
ssh_status=${PIPESTATUS[0]}
set -e

result=$(grep '^deploy_result=' "$work/output" | tail -1 | cut -d= -f2- || true)
previous=$(grep '^deploy_previous_sha=' "$work/output" | tail -1 | cut -d= -f2- || true)
sha=$(grep '^deploy_sha=' "$work/output" | tail -1 | cut -d= -f2- || true)
if [ -z "$result" ]; then
  echo "Deploy script did not report a result (ssh status $ssh_status)" >&2
  exit 1
fi
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "result=$result"
    echo "previous=$previous"
    echo "sha=$sha"
    echo "url=$production_url"
  } >> "$GITHUB_OUTPUT"
fi
echo "Deploy result: $result"
if [ "$result" != "deployed" ] && [ "$result" != "skipped" ]; then
  exit 1
fi
if [ "$ssh_status" -ne 0 ]; then
  exit "$ssh_status"
fi
