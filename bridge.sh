#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"
STATUS_CODE="${STATUS_CODE:-200}"
ACTION="${ACTION:-keep}"
MESSAGE="${MESSAGE:-bridge received request}"

if command -v nc >/dev/null 2>&1; then
  NC_BIN="nc"
elif command -v ncat >/dev/null 2>&1; then
  NC_BIN="ncat"
else
  echo "bridge.sh requires nc or ncat" >&2
  exit 1
fi

listen_once() {
  if [ "$NC_BIN" = "nc" ]; then
    "$NC_BIN" -l -p "$PORT" -q 1
  else
    "$NC_BIN" -l "$PORT"
  fi
}

while true; do
  TMP_FILE="$(mktemp)"
  cleanup() {
    rm -f "$TMP_FILE"
  }
  trap cleanup EXIT

  BODY="$(printf '{"code":%s,"action":"%s","message":"%s"}' "$STATUS_CODE" "$ACTION" "$MESSAGE")"
  BODY_LEN=${#BODY}

  {
    printf 'HTTP/1.1 %s OK\r\n' "$STATUS_CODE"
    printf 'Content-Type: application/json\r\n'
    printf 'Content-Length: %s\r\n' "$BODY_LEN"
    printf 'Connection: close\r\n'
    printf '\r\n'
    printf '%s' "$BODY"
  } | listen_once >"$TMP_FILE"

  echo "----- bridge request begin -----" >&2
  cat "$TMP_FILE" >&2
  echo "----- bridge request end -------" >&2

  cleanup
  trap - EXIT
done
