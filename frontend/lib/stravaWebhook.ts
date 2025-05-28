import { supabaseAdmin } from './supabaseServiceRoleClient';
import { stravaSync } from './config';
import { StravaWebhookEvent } from './types/strava';

/**
 * Validates a webhook event
 * Ensures it contains required fields and has valid values
 */
export function isValidWebhookEvent(event: any): event is StravaWebhookEvent {
  // Check required fields
  if (!event || 
      typeof event !== 'object' ||
      !event.object_type ||
      !event.object_id ||
      !event.aspect_type ||
      !event.owner_id ||
      !event.subscription_id ||
      !event.event_time) {
    return false;
  }

  // Validate field types
  if (typeof event.object_id !== 'number' ||
      typeof event.owner_id !== 'number' ||
      typeof event.subscription_id !== 'number' ||
      typeof event.event_time !== 'number') {
    return false;
  }

  // Validate enum values
  if (event.object_type !== 'activity' && event.object_type !== 'athlete') {
    return false;
  }

  if (event.aspect_type !== 'create' && 
      event.aspect_type !== 'update' && 
      event.aspect_type !== 'delete') {
    return false;
  }

  return true;
}

/**
 * Enqueues a webhook event for async processing
 * Stores the event in the database for later processing
 */
export async function enqueueWebhookEvent(event: StravaWebhookEvent): Promise<string> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    const { data, error } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_data: event,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to enqueue webhook event:', error);
      throw error;
    }

    if (!data || !data.id) {
      throw new Error('No ID returned after inserting webhook event');
    }

    return data.id;
  } catch (error) {
    console.error('Error enqueueing webhook event:', error);
    throw new Error('Failed to enqueue webhook event');
  }
}

/**
 * Processes a webhook event
 * This is called asynchronously after the webhook response is sent
 */
export async function processWebhookEvent(eventId: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    // Mark event as processing
    const { data: event, error: fetchError } = await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'processing' })
      .eq('id', eventId)
      .select('*')
      .single();

    if (fetchError || !event) {
      console.error('Failed to fetch webhook event:', fetchError);
      return;
    }

    const webhookEvent = event.event_data as StravaWebhookEvent;
    
    try {
      if (webhookEvent.object_type === 'activity') {
        await handleActivityEvent(webhookEvent);
      } else if (webhookEvent.object_type === 'athlete') {
        await handleAthleteEvent(webhookEvent);
      }

      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
      }

      // Mark event as completed
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', eventId);

    } catch (processError) {
      console.error('Error processing webhook event:', processError);
      
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
      }
      
      // Update attempts count and status
      const attempts = (event.attempts || 0) + 1;
      const status = attempts >= stravaSync.webhook.maxRetries ? 'failed' : 'pending';
      
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status,
          attempts,
          error_message: processError instanceof Error ? processError.message : String(processError)
        })
        .eq('id', eventId);
    }
  } catch (error) {
    console.error('Error in processWebhookEvent:', error);
  }
}

/**
 * Handles activity-related webhook events
 */
async function handleActivityEvent(event: StravaWebhookEvent): Promise<void> {
  const { object_id: activityId, aspect_type, owner_id: athleteId } = event;

  switch (aspect_type) {
    case 'create':
      // New activity created
      await syncActivity(activityId, athleteId);
      break;
    
    case 'update':
      // Activity updated
      await syncActivity(activityId, athleteId);
      break;
    
    case 'delete':
      // Activity deleted
      await deleteActivity(activityId);
      break;
  }
}

/**
 * Handles athlete-related webhook events
 */
async function handleAthleteEvent(event: StravaWebhookEvent): Promise<void> {
  const { object_id: athleteId, aspect_type, updates } = event;

  // Check for deauthorization
  if (aspect_type === 'update' && updates?.authorized === 'false') {
    await handleDeauthorization(athleteId);
  }
}

/**
 * Syncs an activity from Strava
 * Placeholder for actual implementation
 */
async function syncActivity(activityId: number, athleteId: number): Promise<void> {
  // This would be implemented in a separate file
  console.log(`Syncing activity ${activityId} for athlete ${athleteId}`);
  // TODO: Implement activity sync
}

/**
 * Deletes an activity from the database
 */
async function deleteActivity(activityId: number): Promise<void> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    await supabaseAdmin
      .from('strava_activities')
      .delete()
      .eq('strava_id', activityId);
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    // Also delete related data
    await supabaseAdmin
      .from('strava_activity_streams')
      .delete()
      .eq('activity_id', activityId);
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    await supabaseAdmin
      .from('strava_activity_hr_stream_points')
      .delete()
      .eq('activity_id', activityId);
  } catch (error) {
    console.error(`Failed to delete activity ${activityId}:`, error);
    throw error;
  }
}

/**
 * Handles athlete deauthorization
 */
async function handleDeauthorization(athleteId: number): Promise<void> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    // Update athlete record to indicate deauthorization
    await supabaseAdmin
      .from('strava_athletes')
      .update({
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        webhook_subscription_active: false
      })
      .eq('strava_id', athleteId);
  } catch (error) {
    console.error(`Failed to handle deauthorization for athlete ${athleteId}:`, error);
    throw error;
  }
}