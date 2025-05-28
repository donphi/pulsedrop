#!/bin/bash

# Script to register a webhook subscription with Strava
# This only needs to be run once to set up the webhook

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

# Check if environment variables are set
if [ -z "$STRAVA_CLIENT_ID" ] || [ -z "$STRAVA_CLIENT_SECRET" ] || [ -z "$STRAVA_VERIFY_TOKEN" ]; then
  echo "Error: Required environment variables not set."
  echo "Please ensure the following are set in your frontend/.env file:"
  echo "  - STRAVA_CLIENT_ID"
  echo "  - STRAVA_CLIENT_SECRET"
  echo "  - STRAVA_VERIFY_TOKEN"
  exit 1
fi

# Get the callback URL from environment or use default
CALLBACK_URL=${CALLBACK_URL:-"https://pulsedrop.vercel.app/api/webhooks/strava"}
echo "Using callback URL: $CALLBACK_URL"

# Verify the callback URL is accessible
echo "Verifying callback URL is accessible..."
echo "NOTE: Your webhook endpoint must be publicly accessible and correctly implemented"
echo "      for Strava to verify it during registration."
echo ""

# Register the webhook with Strava
echo "Registering webhook with Strava..."
RESPONSE=$(curl -s -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID \
  -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=$CALLBACK_URL \
  -F verify_token=$STRAVA_VERIFY_TOKEN)

# Check if the request was successful
if [[ $RESPONSE == *"id"* ]]; then
  # Extract the subscription ID
  SUBSCRIPTION_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
  echo "Success! Webhook subscription created with ID: $SUBSCRIPTION_ID"
  echo ""
  echo "Add this to your frontend/.env file:"
  echo "STRAVA_WEBHOOK_SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
else
  echo "Error registering webhook:"
  echo $RESPONSE
  
  # Provide more guidance for common errors
  if [[ $RESPONSE == *"callback url"*"not verifiable"* ]]; then
    echo ""
    echo "The 'callback url not verifiable' error means Strava tried to send a verification"
    echo "request to your webhook endpoint but couldn't reach it or didn't get the expected response."
    echo ""
    echo "Possible solutions:"
    echo "1. Make sure your application is deployed and the webhook endpoint is publicly accessible"
    echo "2. If using ngrok for local development, make sure it's running and the URL is correct"
    echo "3. Verify that your webhook endpoint correctly handles the GET request with the challenge parameter"
    echo "4. Check for typos in your callback URL: $CALLBACK_URL"
  fi
  
  exit 1
fi