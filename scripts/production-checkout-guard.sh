# Sourced by the deploy and preflight scripts. Refuses to continue unless
# APP_DIR is the git work tree root and production env files are untracked.
# shellcheck shell=bash

assert_production_checkout() {
  case "$APP_DIR" in
    /*) ;;
    *) echo "APP_DIR must be an absolute path" >&2; return 1 ;;
  esac
  case "$APP_DIR" in
    *[!A-Za-z0-9/_.-]*) echo "APP_DIR contains unsupported characters" >&2; return 1 ;;
  esac
  case "$APP_DIR" in
    /|/tmp|/root|/home|/home/neurtqox|/home/neurtqox/apps)
      echo "Refusing to deploy: APP_DIR is too broad" >&2
      return 1
      ;;
  esac
  if [ -n "${EXPECTED_APP_DIR:-}" ] && [ "$APP_DIR" != "$EXPECTED_APP_DIR" ]; then
    echo "Refusing to deploy: application root does not match the confirmed path" >&2
    return 1
  fi
  if ! gitc rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "APP_DIR is not a git checkout. Finish the one-time server setup in docs/deployment.md." >&2
    return 1
  fi
  if [ "$(gitc rev-parse --is-bare-repository)" = "true" ]; then
    echo "Refusing to deploy: APP_DIR is a bare repository" >&2
    return 1
  fi
  local here top file
  here=$(pwd -P)
  top=$(gitc rev-parse --show-toplevel)
  if [ "$here" != "$top" ]; then
    echo "Refusing to deploy: $APP_DIR is not the git work tree root" >&2
    return 1
  fi
  if ! gitc rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "Refusing to deploy: the checkout has no commits" >&2
    return 1
  fi
  for file in .env .env.local .env.production .env.production.local; do
    if gitc ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
      echo "Refusing to deploy: $file is tracked. Leave production env files untracked." >&2
      return 1
    fi
  done
}
