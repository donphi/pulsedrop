#!/bin/bash

# Script to test the Strava webhook endpoint locally
# This simulates the validation request that Strava sends when registering a webhook

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

# Check if STRAVA_VERIFY_TOKEN is set
if [ -z "$STRAVA_VERIFY_TOKEN" ]; then
  echo "Error: STRAVA_VERIFY_TOKEN not set in $ENV_FILE"
  exit 1
fi

# Get the callback URL from environment or use default
CALLBACK_URL=${CALLBACK_URL:-"https://pulsedrop.vercel.app/api/webhooks/strava"}
echo "Testing callback URL: $CALLBACK_URL"

# Generate a random challenge string
CHALLENGE=$(openssl rand -hex 16)
echo "Using challenge: $CHALLENGE"

# Construct the test URL with query parameters
TEST_URL="${CALLBACK_URL}?hub.mode=subscribe&hub.challenge=${CHALLENGE}&hub.verify_token=${STRAVA_VERIFY_TOKEN}"

# Send a GET request to the webhook endpoint
echo "Sending test request to webhook endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$TEST_URL")

# Extract the HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo "Response Body: $RESPONSE_BODY"

# Check if the response is valid
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Webhook endpoint returned 200 OK"
  
  # Check if the response contains the challenge
  if echo "$RESPONSE_BODY" | grep -q "$CHALLENGE"; then
    echo "✅ Webhook endpoint correctly echoed the challenge"
    echo "The webhook endpoint is working correctly!"
  else
    echo "❌ Webhook endpoint did not echo the challenge correctly"
    echo "Expected to find '$CHALLENGE' in the response"
    echo "Make sure the endpoint returns JSON in the format: { \"hub.challenge\": \"$CHALLENGE\" }"
  fi
else
  echo "❌ Webhook endpoint did not return 200 OK"
  echo "Make sure the endpoint is accessible and correctly implemented"
fi

# Test with a local server if the remote test failed
if [ "$HTTP_CODE" -ne 200 ]; then
  echo ""
  echo "Would you like to test with a local server? (y/n)"
  read -r answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    LOCAL_URL="http://localhost:3000/api/webhooks/strava?hub.mode=subscribe&hub.challenge=${CHALLENGE}&hub.verify_token=${STRAVA_VERIFY_TOKEN}"
    echo "Testing local URL: $LOCAL_URL"
    echo "Make sure your local server is running on port 3000"
    echo "Press Enter to continue..."
    read -r
    
    LOCAL_RESPONSE=$(curl -s -w "\n%{http_code}" "$LOCAL_URL")
    LOCAL_HTTP_CODE=$(echo "$LOCAL_RESPONSE" | tail -n1)
    LOCAL_RESPONSE_BODY=$(echo "$LOCAL_RESPONSE" | sed '$d')
    
    echo "HTTP Status Code: $LOCAL_HTTP_CODE"
    echo "Response Body: $LOCAL_RESPONSE_BODY"
    
    if [ "$LOCAL_HTTP_CODE" -eq 200 ]; then
      echo "✅ Local webhook endpoint returned 200 OK"
      
      if echo "$LOCAL_RESPONSE_BODY" | grep -q "$CHALLENGE"; then
        echo "✅ Local webhook endpoint correctly echoed the challenge"
        echo "The local webhook endpoint is working correctly!"
        echo ""
        echo "This suggests that your implementation is correct, but the deployed endpoint is not accessible."
        echo "Make sure your application is deployed to $CALLBACK_URL"
      else
        echo "❌ Local webhook endpoint did not echo the challenge correctly"
      fi
    else
      echo "❌ Local webhook endpoint did not return 200 OK"
    fi
  fi
fi

echo ""
echo "Next steps:"
echo "1. If the test failed, fix the issues with your webhook endpoint"
echo "2. If the test succeeded locally but failed remotely, make sure your application is deployed"
echo "3. Once the test succeeds, try registering the webhook with Strava again"