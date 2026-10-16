# Loaded by scripts/ci-deploy.sh. Unlocks a passphrase-protected key
# into a private ssh-agent. The passphrase is never written to disk or logs.
# shellcheck shell=bash

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  echo "Source scripts/ssh-load-key.sh; do not execute it." >&2
  exit 1
fi

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

print_safe_file() {
  # Pass the passphrase only in this process environment, never as an argument.
  PRODUCTION_SSH_PASSPHRASE="${_bmj_passphrase:-${PRODUCTION_SSH_PASSPHRASE:-}}" \
    python3 - "$1" <<'PY'
import os
import sys

text = open(sys.argv[1], errors="replace").read()
for name in ("PRODUCTION_SSH_PASSPHRASE", "PRODUCTION_SSH_KEY"):
    value = os.environ.get(name, "")
    if value and value in text:
        sys.stderr.write("Command output was hidden because it contained a secret.\n")
        raise SystemExit(0)
if "PRIVATE KEY" in text or "-----BEGIN" in text:
    sys.stderr.write("Command output was hidden because it contained key material.\n")
    raise SystemExit(0)
sys.stderr.write(text)
PY
}

load_ssh_key() {
  local work="$1"
  mkdir -p "$work"
  chmod 700 "$work"

  PRODUCTION_SSH_PASSPHRASE=${PRODUCTION_SSH_PASSPHRASE//$'\r'/}
  PRODUCTION_SSH_PASSPHRASE=${PRODUCTION_SSH_PASSPHRASE%$'\n'}
  if [ -z "${PRODUCTION_SSH_PASSPHRASE}" ]; then
    echo "PRODUCTION_SSH_PASSPHRASE is empty" >&2
    return 1
  fi
  export PRODUCTION_SSH_PASSPHRASE PRODUCTION_SSH_KEY

  write_secret_file "$work/id" "$PRODUCTION_SSH_KEY"
  if ! grep -q 'PRIVATE KEY' "$work/id"; then
    echo "PRODUCTION_SSH_KEY does not look like a private key" >&2
    unset PRODUCTION_SSH_KEY PRODUCTION_SSH_PASSPHRASE
    return 1
  fi

  cat > "$work/askpass" <<'EOF'
#!/bin/sh
# SSH_ASKPASS helper. The passphrase stays in the environment.
# A wrong passphrase makes ssh-add ask forever; stop after one reply.
if [ -f "$SSH_ASKPASS.used" ]; then
  exit 1
fi
: > "$SSH_ASKPASS.used"
printf '%s\n' "$PRODUCTION_SSH_PASSPHRASE"
EOF
  chmod 700 "$work/askpass"

  unset SSH_AUTH_SOCK SSH_AGENT_PID
  eval "$(ssh-agent -s)" >/dev/null
  export SSH_ASKPASS="$work/askpass"
  export SSH_ASKPASS_REQUIRE=force
  export DISPLAY="${DISPLAY:-:0}"

  if ! ssh-add -q "$work/id" </dev/null >"$work/ssh-add.out" 2>"$work/ssh-add.err"; then
    print_safe_file "$work/ssh-add.out" >&2 || true
    print_safe_file "$work/ssh-add.err" >&2 || true
    echo "ssh-add rejected PRODUCTION_SSH_KEY. The passphrase in PRODUCTION_SSH_PASSPHRASE did not unlock it." >&2
    rm -f "$work/id" "$work/ssh-add.out" "$work/ssh-add.err"
    ssh-agent -k >/dev/null 2>&1 || true
    unset SSH_AUTH_SOCK SSH_AGENT_PID SSH_ASKPASS SSH_ASKPASS_REQUIRE PRODUCTION_SSH_KEY PRODUCTION_SSH_PASSPHRASE
    return 1
  fi

  # ssh -i on the encrypted private key would prompt again under BatchMode.
  # Give ssh only the public key so it uses the agent identity.
  if ! ssh-add -L > "$work/id.pub"; then
    echo "ssh-add did not expose a public key" >&2
    rm -f "$work/id" "$work/id.pub" "$work/ssh-add.out" "$work/ssh-add.err"
    ssh-agent -k >/dev/null 2>&1 || true
    unset SSH_AUTH_SOCK SSH_AGENT_PID SSH_ASKPASS SSH_ASKPASS_REQUIRE PRODUCTION_SSH_KEY PRODUCTION_SSH_PASSPHRASE
    return 1
  fi
  chmod 644 "$work/id.pub"
  rm -f "$work/id" "$work/ssh-add.out" "$work/ssh-add.err"
  BMJ_IDENTITY_FILE=$work/id.pub
  export BMJ_IDENTITY_FILE

  # Later ssh/scp use the agent and must not inherit the passphrase or askpass.
  unset SSH_ASKPASS SSH_ASKPASS_REQUIRE PRODUCTION_SSH_KEY PRODUCTION_SSH_PASSPHRASE
}
