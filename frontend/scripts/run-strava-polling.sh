#!/bin/bash

# Wrapper script to source environment variables from frontend/.env
# and then run the Strava polling function

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

# Run the polling function directly using Node.js
echo "Running Strava polling script..."
cd "$FRONTEND_DIR"

# Create a temporary JavaScript file to run the polling function
cat > /tmp/run-polling.js << 'EOF'
const { pollForMissedActivities } = require('./lib/stravaPolling');

async function main() {
  console.log('Starting Strava polling task at', new Date().toISOString());
  
  try {
    await pollForMissedActivities();
    console.log('Strava polling task completed successfully');
  } catch (error) {
    console.error('Error in Strava polling task:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in Strava polling task:', error);
  process.exit(1);
});
EOF

# Run the temporary file
node /tmp/run-polling.js

# Clean up
rm -f /tmp/run-polling.js