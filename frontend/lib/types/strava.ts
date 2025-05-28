/**
 * Type definitions for Strava API and webhook events
 */

/**
 * Strava webhook event object
 * @see https://developers.strava.com/docs/webhooks/
 */
export interface StravaWebhookEvent {
  /** Always either "activity" or "athlete" */
  object_type: 'activity' | 'athlete';
  
  /** For activity events, the activity's ID. For athlete events, the athlete's ID */
  object_id: number;
  
  /** Always "create", "update", or "delete" */
  aspect_type: 'create' | 'update' | 'delete';
  
  /** For activity update events, contains changed fields. For deauth, contains "authorized": "false" */
  updates?: {
    title?: string;
    type?: string;
    private?: 'true' | 'false';
    authorized?: 'false';
    [key: string]: string | undefined;
  };
  
  /** The athlete's ID */
  owner_id: number;
  
  /** The push subscription ID receiving this event */
  subscription_id: number;
  
  /** The time the event occurred (Unix timestamp) */
  event_time: number;
}

/**
 * Strava webhook validation request query parameters
 */
export interface StravaWebhookValidation {
  'hub.mode': string;
  'hub.challenge': string;
  'hub.verify_token': string;
}

/**
 * Strava webhook validation response
 */
export interface StravaWebhookValidationResponse {
  'hub.challenge': string;
}

/**
 * Strava webhook subscription
 */
export interface StravaWebhookSubscription {
  id: number;
  resource_state: number;
  application_id: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Strava webhook event database record
 */
export interface WebhookEventRecord {
  id: string;
  event_data: StravaWebhookEvent;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}