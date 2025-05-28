# Strava Data Pull Summary

This document provides a concise answer to the question: **When and how do we pull the user's activity data after they allow access through Strava?**

## Data Pull Timeline

1. **Immediate Initial Sync** - As soon as a user authorizes our application through Strava OAuth, we perform an initial sync of their historical activity data.

2. **Real-time Updates via Webhooks** - After initial sync, we receive real-time updates through Strava webhooks whenever the user creates, updates, or deletes activities.

3. **Periodic Polling Fallback** - As a safety net, we periodically check for any missed activities (configurable, default: every 4 hours).

## How Data is Pulled

### Initial Sync Process

When a user first authorizes our application:

1. We obtain OAuth access and refresh tokens from Strava
2. We immediately fetch historical activities (default: past 7 days)
3. For each activity, we fetch:
   - Basic activity data (distance, time, type, etc.)
   - Heart rate data (if available)
   - GPS data (if available)
   - Other metrics (cadence, power, etc.)
4. Activities are processed in batches to respect Strava API rate limits
5. All data is stored in our Supabase database

### Webhook-based Updates

For ongoing data synchronization:

1. We register a webhook subscription with Strava during user onboarding
2. Strava sends webhook events to our endpoint at `/api/webhooks/strava`
3. Our webhook handler:
   - Validates the incoming event
   - Stores it in the `webhook_events` table
   - Responds to Strava quickly (within 2 seconds)
   - Processes the event asynchronously
4. The async processor:
   - Fetches detailed activity data from Strava API
   - Updates our database accordingly
   - Handles retries for failed events

### Polling Fallback

As a safety net:

1. A scheduled process runs periodically (default: every 4 hours)
2. It fetches recent activities from Strava
3. It compares with our database to identify any missing activities
4. Any missing activities are fetched and stored

## Data Storage

Activity data is stored in several tables:

1. `strava_activities` - Basic activity information
2. `strava_activity_streams` - Time-series data for activities
3. `strava_activity_hr_stream_points` - Detailed heart rate data points

## Configuration

The entire process is configurable through the `stravaSync` object in `lib/config.ts`, allowing for adjustments to:

- How much historical data to fetch initially
- Batch sizes and delays for API requests
- Webhook processing timeouts and retries
- Polling frequency and limits

## Implementation Files

The implementation is spread across several files:

1. `lib/config.ts` - Configuration settings
2. `lib/types/strava.ts` - TypeScript interfaces for Strava data
3. `lib/stravaWebhook.ts` - Webhook event handling utilities
4. `lib/stravaApi.ts` - Strava API client
5. `app/api/webhooks/strava/route.ts` - Webhook endpoint
6. Database tables (defined in SQL files)

## Summary

Our approach to pulling user activity data from Strava follows a hybrid model:

1. **Pull** - Initial historical data sync and periodic polling
2. **Push** - Real-time updates via webhooks

This ensures we have complete and up-to-date activity data while minimizing API calls and respecting Strava's rate limits.