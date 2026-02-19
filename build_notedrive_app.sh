#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="NoteDrive.app"
APP_PATH="$ROOT_DIR/$APP_NAME"
LAUNCH_SCRIPT="$ROOT_DIR/launch_notedrive_mac.sh"
TMP_SCRIPT="$ROOT_DIR/.notedrive_launcher.applescript"

if [ ! -x "$LAUNCH_SCRIPT" ]; then
  echo "Missing launcher: $LAUNCH_SCRIPT"
  exit 1
fi

cat > "$TMP_SCRIPT" <<EOF
do shell script "bash '$LAUNCH_SCRIPT' >/dev/null 2>&1 &"
EOF

rm -rf "$APP_PATH"
osacompile -o "$APP_PATH" "$TMP_SCRIPT"
rm -f "$TMP_SCRIPT"

echo "Created: $APP_PATH"
