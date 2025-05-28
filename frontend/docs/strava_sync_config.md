# Strava Sync Configuration

This document outlines the configuration parameters for the Strava webhook sync system. These settings control the timing and behavior of data synchronization between Strava and our application.

## Configuration Parameters

These parameters should be added to the central configuration file (`/lib/config.ts`):

```typescript
// Strava Sync Configuration
export const stravaSync = {
  // Initial sync settings
  initialSync: {
    // Number of days of historical data to fetch when a user first connects
    daysToFetch: 30,
    
    // Maximum number of activities to fetch during initial sync
    maxActivities: 200,
    
    // Batch size for processing activities during initial sync
    batchSize: 10,
    
    // Delay between batches to respect rate limits (in milliseconds)
    batchDelay: 1000,
  },
  
  // Webhook settings
  webhook: {
    // Maximum time to respond to webhook events (in milliseconds)
    // Strava requires response within 2 seconds
    responseTimeout: 1500,
    
    // Maximum number of retry attempts for failed webhook processing
    maxRetries: 3,
    
    // Delay between retry attempts (in milliseconds)
    retryDelay: 5000,
  },
  
  // API request settings
  api: {
    // Timeout for Strava API requests (in milliseconds)
    requestTimeout: 10000,
    
    // Base delay for exponential backoff on rate limit errors (in milliseconds)
    baseRetryDelay: 1000,
    
    // Maximum retry attempts for API requests
    maxRetries: 3,
  },
  
  // Polling fallback (as backup to webhooks)
  polling: {
    // Whether to enable polling as fallback
    enabled: true,
    
    // Interval between polls (in milliseconds)
    // 4 hours = 14,400,000 ms
    interval: 14_400_000,
    
    // Number of recent activities to check in each poll
    activityLimit: 10,
  },
  
  // Activity data settings
  activity: {
    // Whether to fetch detailed activity data
    fetchDetails: true,
    
    // Whether to fetch activity streams (time-series data)
    fetchStreams: true,
    
    // Stream types to fetch (time-series data)
    streamTypes: ['time', 'heartrate', 'latlng', 'altitude', 'cadence', 'watts'],
    
    // Whether to process heart rate data into separate table for analysis
    processHeartRate: true,
  },
};
```

## Implementation Notes

1. **Minimal Implementation**: Keep the implementation lean by only implementing the features you need initially. The configuration above allows for selective enabling/disabling of features.

2. **Adjustable Timing**: All timing parameters are centralized in this configuration, making it easy to adjust based on your specific needs and Strava API rate limits.

3. **Fallback Mechanism**: The polling configuration provides a safety net in case webhooks fail, but can be disabled if not needed.

4. **Selective Data Processing**: Configure exactly which data streams to fetch and process, avoiding unnecessary processing.

## Recommended Initial Settings

For a minimal implementation, we recommend:

- Set `initialSync.daysToFetch` to 7 (one week) initially
- Set `polling.enabled` to true as a safety net
- Set `activity.fetchStreams` based on whether you need detailed time-series data
- Consider setting `processHeartRate` to false initially if heart rate analysis is not a priority

These settings can be adjusted as your application's needs evolve.