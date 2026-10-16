#!/usr/bin/env bash
# Runner-side SSH deploy. Secret values are never printed.
set +x
set -euo pipefail

script_dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=ssh-load-key.sh
source "$script_dir/ssh-load-key.sh"

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
require PRODUCTION_SSH_PASSPHRASE
require PRODUCTION_PATH
require PRODUCTION_URL
require PRODUCTION_KNOWN_HOSTS
require PRODUCTION_NODE_SETUP
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing GitHub Actions secrets: ${missing[*]}" >&2
  echo "Add them to the repository or the production environment, then rerun the workflow." >&2
  exit 1
fi

# This host accepts SSH on 21098. Port 22 does not connect.
PRODUCTION_PORT=${PRODUCTION_PORT:-21098}
ROLLBACK_MODE=${ROLLBACK_MODE:-0}
PREFLIGHT=${PREFLIGHT:-0}
PRODUCTION_PATH=${PRODUCTION_PATH%/}
PRODUCTION_NODE_SETUP=${PRODUCTION_NODE_SETUP//$'\r'/}
PRODUCTION_NODE_SETUP=${PRODUCTION_NODE_SETUP%$'\n'}

case "$PRODUCTION_PORT" in
  ''|*[!0-9]*) echo "PRODUCTION_PORT must be a number" >&2; exit 1 ;;
esac
case "$ROLLBACK_MODE" in
  0|1) ;;
  *) echo "ROLLBACK_MODE must be 0 or 1" >&2; exit 1 ;;
esac
case "$PREFLIGHT" in
  0|1) ;;
  *) echo "PREFLIGHT must be 0 or 1" >&2; exit 1 ;;
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

confirmed_host="premium55-5.web-hosting.com"
confirmed_user="neurtqox"
confirmed_port="21098"
confirmed_path="/home/neurtqox/apps/bmjmasjid"
confirmed_url="https://bmjmasjid.neuroncosmo.com"
confirmed_node="source /home/neurtqox/nodevenv/apps/bmjmasjid/22/bin/activate"

if [ "$PRODUCTION_HOST" != "$confirmed_host" ]; then
  echo "PRODUCTION_HOST does not match the confirmed Namecheap SSH host" >&2
  exit 1
fi
if [ "$PRODUCTION_USER" != "$confirmed_user" ]; then
  echo "PRODUCTION_USER does not match the confirmed cPanel user" >&2
  exit 1
fi
if [ "$PRODUCTION_PORT" != "$confirmed_port" ]; then
  echo "PRODUCTION_PORT does not match the confirmed SSH port 21098" >&2
  exit 1
fi
if [ "$PRODUCTION_PATH" != "$confirmed_path" ]; then
  echo "PRODUCTION_PATH does not match the confirmed application root" >&2
  exit 1
fi
if [ "$PRODUCTION_NODE_SETUP" != "$confirmed_node" ]; then
  echo "PRODUCTION_NODE_SETUP must be exactly: $confirmed_node" >&2
  exit 1
fi

if [ "$PREFLIGHT" != 1 ]; then
  if ! printf '%s' "$GITHUB_SHA" | grep -Eq '^[0-9a-f]{40}$'; then
    echo "GITHUB_SHA must be a 40-character commit" >&2
    exit 1
  fi
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
if [ "$production_url" != "$confirmed_url" ]; then
  echo "PRODUCTION_URL does not match the confirmed public origin" >&2
  exit 1
fi

work=$(mktemp -d)
agent_started=0
cleanup() {
  unset _bmj_passphrase PRODUCTION_SSH_PASSPHRASE PRODUCTION_SSH_KEY || true
  if [ "$agent_started" = 1 ]; then
    ssh-agent -k >/dev/null 2>&1 || true
  fi
  rm -rf "$work"
}
trap cleanup EXIT
umask 077

_bmj_passphrase=$PRODUCTION_SSH_PASSPHRASE
if ! load_ssh_key "$work"; then
  unset _bmj_passphrase
  exit 1
fi
agent_started=1
if [ -z "${BMJ_IDENTITY_FILE:-}" ] || [ ! -f "$BMJ_IDENTITY_FILE" ]; then
  echo "SSH identity was not loaded into the agent" >&2
  exit 1
fi

write_secret_file "$work/known_hosts" "$PRODUCTION_KNOWN_HOSTS"
unset PRODUCTION_KNOWN_HOSTS

node_b64=$(printf '%s' "$PRODUCTION_NODE_SETUP" | base64 -w0)
restart_b64=$(printf '%s' "${PRODUCTION_RESTART_COMMAND:-}" | base64 -w0)
unset PRODUCTION_NODE_SETUP PRODUCTION_RESTART_COMMAND

cat > "$work/deploy.env" <<EOF
DEPLOY_SHA=${GITHUB_SHA:-}
APP_DIR=$confirmed_path
EXPECTED_APP_DIR=$confirmed_path
ROLLBACK_MODE=$ROLLBACK_MODE
NODE_B64=$node_b64
RESTART_B64=$restart_b64
EOF
chmod 600 "$work/deploy.env"

ssh_opts=(
  -i "$BMJ_IDENTITY_FILE"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o ForwardAgent=no
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="$work/known_hosts"
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=40
  -o ConnectTimeout=20
)

remote="${confirmed_user}@${confirmed_host}"
remote_dir=$(ssh "${ssh_opts[@]}" -p "$confirmed_port" "$remote" 'umask 077; mktemp -d /tmp/bmj-deploy.XXXXXX')
case "$remote_dir" in
  /tmp/bmj-deploy.[A-Za-z0-9]*) ;;
  *) echo "Remote scratch directory was not created under /tmp/bmj-deploy.*" >&2; exit 1 ;;
esac

copy_remote() {
  local src="$1"
  local name="$2"
  scp "${ssh_opts[@]}" -P "$confirmed_port" "$src" "${remote}:${remote_dir}/${name}"
}

if [ "$PREFLIGHT" = 1 ]; then
  copy_remote "$script_dir/preflight-remote.sh" "preflight-remote.sh"
  copy_remote "$script_dir/production-checkout-guard.sh" "production-checkout-guard.sh"
  copy_remote "$work/deploy.env" "deploy.env"
  set +e
  ssh "${ssh_opts[@]}" -p "$confirmed_port" "$remote" \
    "chmod 700 '$remote_dir'/* && bash '$remote_dir/preflight-remote.sh'; status=\$?; rm -rf '$remote_dir'; exit \$status" \
    >"$work/output" 2>"$work/ssh.err"
  ssh_status=$?
  set -e
  if [ -s "$work/ssh.err" ]; then
    print_safe_file "$work/ssh.err" >&2 || true
  fi
  grep -E '^(preflight_result|preflight_head|preflight_node|preflight_npm|preflight_env_files|preflight_database_url|preflight_remote|preflight_writable|preflight_startup|preflight_restart_file|preflight_disk_kb|preflight_tracked_changes|preflight_passenger)=' "$work/output" || true
  result=$(grep '^preflight_result=' "$work/output" | tail -1 | cut -d= -f2- || true)
  if [ "$result" != "ok" ]; then
    echo "Preflight did not pass (ssh status $ssh_status)" >&2
    exit 1
  fi
  exit "$ssh_status"
fi

if [ -n "${NEXT_BUILD_TAR:-}" ]; then
  if [ ! -f "$NEXT_BUILD_TAR" ]; then
    echo "NEXT_BUILD_TAR does not exist" >&2
    exit 1
  fi
  printf '\nNEXT_TARBALL=%s\n' "$remote_dir/next.tgz" >> "$work/deploy.env"
  copy_remote "$NEXT_BUILD_TAR" "next.tgz"
fi
copy_remote "$script_dir/deploy-production.sh" "deploy-production.sh"
copy_remote "$script_dir/deploy-remote-entry.sh" "deploy-remote-entry.sh"
copy_remote "$script_dir/production-checkout-guard.sh" "production-checkout-guard.sh"
copy_remote "$work/deploy.env" "deploy.env"

set +e
ssh "${ssh_opts[@]}" -p "$confirmed_port" "$remote" \
  "chmod 700 '$remote_dir'/* && bash '$remote_dir/deploy-remote-entry.sh'; status=\$?; rm -rf '$remote_dir'; exit \$status" \
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
