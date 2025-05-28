# Strava Webhook Integration Setup

This document provides instructions for setting up and using the Strava webhook integration in the application.

## Overview

Strava webhooks allow our application to receive real-time notifications when events occur in a user's Strava account, such as:
- New activities being created
- Activities being updated or deleted
- Athletes deauthorizing our application

This enables us to keep our database in sync with Strava without having to poll the API constantly.

## Prerequisites

Before setting up the webhook, ensure you have:

1. A Strava API application set up at [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. The following environment variables set in your `frontend/.env` file:
   - `STRAVA_CLIENT_ID` - Your Strava API client ID
   - `STRAVA_CLIENT_SECRET` - Your Strava API client secret
   - `STRAVA_VERIFY_TOKEN` - A random string you create to verify webhook requests

All scripts and components in this project are configured to read these environment variables from the `frontend/.env` file.

## Setup Steps

### 1. Create a Verify Token

The verify token is a security measure that helps verify webhook requests are coming from Strava. This is **not** user-specific - it's a single application-level token that you (the application owner) create yourself.

Generate a random string to use as your verify token:

```bash
# Example of generating a random token
openssl rand -base64 32
```

Add this token to your `frontend/.env` file:

```
STRAVA_VERIFY_TOKEN=your_random_token_here
```

This token will be:
1. Sent to Strava when you register your webhook
2. Included by Strava in validation requests to your endpoint
3. Verified by your endpoint to confirm requests are legitimate

It's a shared secret between your application and Strava's webhook system, not related to individual users.

### 2. Make Your Webhook Endpoint Publicly Accessible

Your webhook endpoint needs to be publicly accessible for Strava to send requests to it. The endpoint is:

```
https://your-domain.com/api/webhooks/strava
```

If you're developing locally, you can use a service like ngrok to expose your local server:

```bash
ngrok http 3000
```

This will give you a temporary public URL that forwards to your local server.

### 3. Register Your Webhook with Strava

Use the provided script to register your webhook with Strava:

```bash
# Make the script executable first
chmod +x frontend/scripts/register-strava-webhook.sh

# Set the callback URL to your public endpoint
export CALLBACK_URL=https://your-domain.com/api/webhooks/strava
# Or if using ngrok:
# export CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/webhooks/strava

# Run the registration script
./frontend/scripts/register-strava-webhook.sh
```

The script will automatically load environment variables from `frontend/.env` and output a subscription ID. The script will prompt you to add this ID to your `frontend/.env` file:

```
STRAVA_WEBHOOK_SUBSCRIPTION_ID=your_subscription_id
```

### 4. Verify the Webhook is Working

To verify that the webhook is working:

1. Log in to the application with a Strava account
2. Create a new activity in Strava
3. Check the application logs to see if the webhook event was received and processed

## Webhook Processing Flow

When a webhook event is received:

1. The event is validated to ensure it's a valid Strava webhook event
2. The event is stored in the `webhook_events` table with a status of `pending`
3. The event is processed asynchronously to avoid timeouts
4. Depending on the event type:
   - For activity events: The activity is synced from Strava to our database
   - For athlete events: If it's a deauthorization, the athlete's tokens are removed

## Polling Fallback

In addition to webhooks, the application includes a polling fallback mechanism to ensure data consistency even if webhook events are missed. This is particularly useful for:

- Initial deployment before webhook setup is complete
- Temporary webhook failures due to network issues
- Activities created when the application was offline

The polling mechanism periodically checks for recent activities that might have been missed by the webhook and syncs them to the database.

### How Polling Works

1. The polling function runs at regular intervals (configured to run every 4 hours by default)
2. It fetches recent activities for all athletes with valid tokens
3. It checks if each activity exists in the database
4. If an activity doesn't exist, it syncs it from Strava

### Running the Polling Function

You can run the polling function manually using the provided shell script:

```bash
# Make the script executable first
chmod +x frontend/scripts/run-strava-polling.sh

# Run the script
./frontend/scripts/run-strava-polling.sh
```

This script will automatically load environment variables from `frontend/.env` before running the polling function.

For production, set up a scheduled task or cron job:

```
# Run every 4 hours
0 */4 * * * /path/to/project/frontend/scripts/run-strava-polling.sh
```

### Configuring Polling

Polling behavior can be configured in `lib/config.ts`:

```typescript
polling: {
  // Whether to enable polling as fallback
  enabled: true,
  
  // Interval between polls (ms) - 4 hours
  interval: 14_400_000,
  
  // Number of recent activities to check in each poll
  activityLimit: 10,
}
```

## Troubleshooting

### Common Issues

#### "Callback URL Not Verifiable" Error

If you see this error when registering your webhook:

```
{"message":"Bad Request","errors":[{"resource":"PushSubscription","field":"callback url","code":"not verifiable"}]}
```

This means Strava tried to send a verification request to your webhook endpoint but couldn't reach it or didn't get the expected response. To fix this:

1. **Ensure your application is deployed and running**
   - Your webhook endpoint must be publicly accessible on the internet
   - If using Vercel, make sure your app is deployed successfully

2. **Check for typos in your callback URL**
   - The default URL in the script is `https://pulsedrop.vercel.app/api/webhooks/strava`
   - Make sure it matches your actual deployed URL

3. **Verify your webhook endpoint implementation**
   - The endpoint must correctly handle the GET request with the challenge parameter
   - Check the implementation in `frontend/app/api/webhooks/strava/route.ts`

4. **For local development**
   - Use ngrok to expose your local server: `ngrok http 3000`
   - Update the callback URL to your ngrok URL: `export CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/webhooks/strava`

### General Troubleshooting

If you're having other issues with the webhook or polling:

1. Check the application logs for errors
2. Verify that your webhook endpoint is publicly accessible
3. Ensure your environment variables are set correctly
4. Check the Strava API dashboard for webhook subscription status
5. Try running the polling function manually to sync missed activities

## Webhook Event Structure

Strava webhook events have the following structure:

```json
{
  "object_type": "activity",
  "object_id": 12345678987654321,
  "aspect_type": "create",
  "owner_id": 12345,
  "subscription_id": 123456,
  "event_time": 1516126040
}
```

- `object_type`: Either "activity" or "athlete"
- `object_id`: The ID of the activity or athlete
- `aspect_type`: "create", "update", or "delete"
- `owner_id`: The athlete's ID
- `subscription_id`: Your webhook subscription ID
- `event_time`: When the event occurred (Unix timestamp)

For "update" events, there's also an `updates` field containing the changed fields.

## References

- [Strava Webhooks Documentation](https://developers.strava.com/docs/webhooks/)
- [Strava API Documentation](https://developers.strava.com/docs/reference/)