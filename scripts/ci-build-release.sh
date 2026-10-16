#!/usr/bin/env bash
# Compile .next on the GitHub runner. The production host cannot run Turbopack.
set -euo pipefail

sha=${GITHUB_SHA:?GITHUB_SHA is required}
out=${NEXT_BUILD_TAR:?NEXT_BUILD_TAR is required}
if ! printf '%s' "$sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "GITHUB_SHA must be a 40-character commit" >&2
  exit 1
fi

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cleanup() {
  if [ -n "${work:-}" ]; then
    git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || rm -rf "$work"
  fi
}
trap cleanup EXIT

src=$root
if [ "$(git -C "$root" rev-parse HEAD)" != "$sha" ]; then
  git -C "$root" fetch --no-tags --depth=1 origin "$sha"
  work=$(mktemp -d)
  rmdir "$work"
  git -C "$root" worktree add --detach "$work" "$sha"
  src=$work
fi

mkdir -p "$src/src/server"
cat > "$src/src/server/deployed-commit.ts" <<EOF
/** Build stamp written by scripts/deploy-production.sh. Not a secret. */
export const deployedCommit = "${sha}";
EOF

(
  cd "$src"
  npm ci
  npm run build
)

mkdir -p "$(dirname "$out")"
tar -C "$src" -czf "$out" .next
