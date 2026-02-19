#!/bin/bash
set -euo pipefail

PORT="${NOTEDRIVE_PORT:-9002}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$ROOT_DIR/logs/notedrive.pid"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    kill "$PID"
  fi
  rm -f "$PID_FILE"
fi

PIDS="$(lsof -tiTCP:$PORT -sTCP:LISTEN || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS || true
fi
