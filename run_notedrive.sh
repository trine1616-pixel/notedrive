#!/bin/bash

# Port to run the application on
PORT=9002

echo "🚀 Starting NoteDrive on port $PORT..."

# 1. Dependency Checks
command -v node >/dev/null 2>&1 || { echo >&2 "❌ Error: node is not installed. Please install Node.js."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "❌ Error: npm is not installed. Please install npm."; exit 1; }
command -v nc >/dev/null 2>&1 || { echo >&2 "⚠️ Warning: nc (netcat) is not installed. Readiness check will be skipped."; NO_NC=1; }

# 2. Directory Check
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$PROJECT_ROOT/notedrive"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: Directory '$APP_DIR' not found."
    exit 1
fi

cd "$APP_DIR"

# 3. Port Conflict Check
if [ -z "$NO_NC" ]; then
    if nc -z localhost $PORT >/dev/null 2>&1; then
        echo "❌ Error: Port $PORT is already in use. Please stop the other process or change the port."
        exit 1
    fi
fi

# 4. node_modules Check
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install || { echo "❌ Error: npm install failed."; exit 1; }
fi

# 5. Start the Next.js development server
echo "📡 Starting development server..."
npm run dev -- -p $PORT &

# Save the PID of the background process
SERVER_PID=$!

# Function to handle script termination
cleanup() {
  echo ""
  echo "🛑 Stopping NoteDrive..."
  kill $SERVER_PID 2>/dev/null
  exit
}

# Trap SIGINT and SIGTERM to ensure the server stops when the script is closed
trap cleanup SIGINT SIGTERM

# 6. Wait for the server to be ready
if [ -z "$NO_NC" ]; then
    echo "Waiting for server to start..."
    MAX_RETRIES=30
    COUNT=0
    while ! nc -z localhost $PORT; do   
        sleep 1
        COUNT=$((COUNT + 1))
        if [ $COUNT -ge $MAX_RETRIES ]; then
            echo "❌ Error: Server failed to start within $MAX_RETRIES seconds."
            kill $SERVER_PID
            exit 1
        fi
    done
    echo "✅ Server is ready!"
else
    echo "Waiting for server (no nc)..."
    sleep 5
fi

# 7. Open the default browser to the application URL
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:$PORT"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open "http://localhost:$PORT"
else
  echo "Could not detect OS to open browser automatically. Please visit http://localhost:$PORT"
fi

# Keep the script running to maintain the background process
wait $SERVER_PID
