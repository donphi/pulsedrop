#!/bin/bash

# Wrapper script to source environment variables from frontend/.env
# and then run the run-strava-polling.ts script

# Determine script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

# Check if .env file exists
ENV_FILE="$FRONTEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  echo "Please create a .env file with the required environment variables."
  exit 1
fi

# Source environment variables from .env file
echo "Loading environment variables from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

# Run the TypeScript script with ts-node
echo "Running Strava polling script..."
npx ts-node "$SCRIPT_DIR/run-strava-polling.ts"