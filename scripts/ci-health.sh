#!/usr/bin/env bash
# Confirm the existing public HTTPS site is serving this deploy.
set -euo pipefail

url=${PRODUCTION_URL:?PRODUCTION_URL is required}
sha=${EXPECTED_SHA:?EXPECTED_SHA is required}
url=${url%/}

python3 - "$url" <<'PY'
import sys
from urllib.parse import urlparse
parsed = urlparse(sys.argv[1])
if parsed.scheme != "https" or not parsed.hostname:
    sys.exit("Refusing to health-check a non-HTTPS URL")
PY

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for attempt in $(seq 1 18); do
  home_code=$(curl -sS -o "$tmp/home" -w '%{http_code}' --max-time 20 --max-redirs 3 "$url/" || true)
  health_code=$(curl -sS -o "$tmp/health" -w '%{http_code}' --max-time 20 --max-redirs 3 "$url/api/health" || true)
  if [ "$home_code" = "200" ] && [ "$health_code" = "200" ]; then
    if EXPECTED_SHA="$sha" python3 - "$tmp/health" <<'PY'
import json, os, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    body = json.load(handle)
if body.get("ok") is True and body.get("sha") == os.environ["EXPECTED_SHA"]:
    sys.exit(0)
sys.exit(1)
PY
    then
      echo "Live site is serving $sha"
      exit 0
    fi
  fi
  echo "Waiting for $sha (attempt $attempt: home=$home_code health=$health_code)"
  sleep 5
done

echo "Health check failed for $url" >&2
exit 1
