#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHER="$ROOT_DIR/launch_notedrive_mac.sh"

if [ ! -x "$LAUNCHER" ]; then
  chmod +x "$LAUNCHER"
fi

echo "Launching NoteDrive via stable macOS launcher..."
exec "$LAUNCHER"
