#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"
LOG_DIR="${LOG_DIR:-bridge-logs}"

if ! command -v ncat >/dev/null 2>&1; then
  echo "bridge.sh requires ncat" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

send_response() {
  local status_code="$1"
  local body="$2"
  local body_len
  body_len=${#body}

  printf 'HTTP/1.1 %s OK\r\n' "$status_code"
  printf 'Access-Control-Allow-Origin: *\r\n'
  printf 'Access-Control-Allow-Methods: GET,POST,OPTIONS\r\n'
  printf 'Access-Control-Allow-Headers: Content-Type\r\n'
  printf 'Content-Type: application/json\r\n'
  printf 'Content-Length: %s\r\n' "$body_len"
  printf 'Connection: close\r\n'
  printf '\r\n'
  printf '%s' "$body"
}

handle_connection() {
  local request_line
  local method path
  local content_length=0
  local header_line
  local body=""

  IFS= read -r request_line || exit 0
  request_line=${request_line%$'\r'}
  method=$(printf '%s' "$request_line" | awk '{print $1}')
  path=$(printf '%s' "$request_line" | awk '{print $2}')

  while IFS= read -r header_line; do
    header_line=${header_line%$'\r'}
    [ -z "$header_line" ] && break
    case "$header_line" in
      [Cc]ontent-[Ll]ength:*)
        content_length=$(printf '%s' "$header_line" | cut -d: -f2 | tr -d ' ')
        ;;
    esac
  done

  if [ "$content_length" -gt 0 ] 2>/dev/null; then
    IFS= read -r -N "$content_length" body || true
  fi

  if [ "$method" = "OPTIONS" ]; then
    send_response 200 '{"code":200}'
    exit 0
  fi

  if [ "$method" = "GET" ] && [ "$path" = "/health" ]; then
    send_response 200 '{"code":200,"ready":true}'
    exit 0
  fi

  if [ "$method" = "POST" ]; then
    local log_id timestamp log_file
    timestamp=$(date '+%Y%m%d-%H%M%S')
    log_id="${timestamp}-$$-$(date '+%N')"
    log_file="${LOG_DIR}/bridge-log-${log_id}.json"

    cat >"$log_file" <<EOF
{
  "id": "${log_id}",
  "method": "${method}",
  "path": "${path}",
  "timestamp": "$(date --iso-8601=seconds 2>/dev/null || date)",
  "body": ${body:-null}
}
EOF

    send_response 200 '{"code":200}'
    exit 0
  fi

  send_response 405 '{"code":405}'
}

if [ "${1:-}" = "--handle" ]; then
  handle_connection
else
  echo "bridge listening on http://127.0.0.1:${PORT}/" >&2
  echo "logs will be written to ${LOG_DIR}/" >&2
  while true; do
    ncat -l 127.0.0.1 "$PORT" -c "$0 --handle"
  done
fi
