#!/bin/bash
set -euo pipefail

PORT="${NOTEDRIVE_PORT:-9002}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT_DIR/notedrive"
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$LOG_DIR/notedrive.pid"
SERVER_LOG="$LOG_DIR/notedrive_server.log"
NPM_BIN="/usr/local/bin/npm"
NODE_BIN="/usr/local/bin/node"

mkdir -p "$LOG_DIR"

if [ ! -d "$APP_DIR" ]; then
  exit 1
fi

if [ ! -x "$NPM_BIN" ]; then
  NPM_BIN="$(command -v npm || true)"
fi

if [ -z "$NPM_BIN" ] || [ ! -x "$NPM_BIN" ]; then
  echo "npm not found. Install Node.js/npm first." >>"$SERVER_LOG"
  exit 1
fi

if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node || true)"
fi

if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "node not found. Install Node.js first." >>"$SERVER_LOG"
  exit 1
fi

# Finder/AppleScript launches can have restricted PATH.
export PATH="$(dirname "$NODE_BIN"):$(dirname "$NPM_BIN"):/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

is_running() {
  lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

stop_server() {
  local pids
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)"
  if [ -n "$pids" ]; then
    echo "Stopping existing process on :$PORT ($pids)" >>"$SERVER_LOG"
    kill $pids >/dev/null 2>&1 || true
    sleep 1
  fi
}

if is_running; then
  stop_server
fi

if ! is_running; then
  if [ ! -d "$APP_DIR/node_modules" ]; then
    (cd "$APP_DIR" && "$NPM_BIN" install) >>"$SERVER_LOG" 2>&1 || true
  fi

  DAEMON_SCRIPT="$ROOT_DIR/start_notedrive_daemon.mjs"
  if [ ! -f "$DAEMON_SCRIPT" ]; then
    echo "daemon script not found at $DAEMON_SCRIPT" >>"$SERVER_LOG"
    exit 1
  fi

  "$NODE_BIN" "$DAEMON_SCRIPT" >>"$SERVER_LOG" 2>&1 || true

  for _ in $(seq 1 30); do
    if is_running; then
      break
    fi
    sleep 1
  done
fi

open "http://localhost:$PORT"
