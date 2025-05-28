import { supabaseAdmin } from './supabaseServiceRoleClient';
import { stravaSync } from './config';
import { getAthleteActivities, syncActivity } from './stravaApi';

/**
 * Polls for missed activities as a fallback to webhooks
 * This function should be called periodically (e.g., every 4 hours)
 * It checks for recent activities that might have been missed by the webhook
 */
export async function pollForMissedActivities(): Promise<void> {
  // Skip if polling is disabled in config
  if (!stravaSync.polling.enabled) {
    console.log('Strava polling is disabled in config');
    return;
  }

  try {
    console.log('Starting Strava polling for missed activities');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    // Get all athletes with valid tokens
    const { data: athletes, error: athletesError } = await supabaseAdmin
      .from('strava_athletes')
      .select('strava_id')
      .not('strava_access_token', 'is', null);
    
    if (athletesError) {
      throw new Error(`Failed to fetch athletes: ${athletesError.message}`);
    }
    
    if (!athletes || athletes.length === 0) {
      console.log('No athletes found with valid tokens');
      return;
    }
    
    console.log(`Found ${athletes.length} athletes to check for missed activities`);
    
    // Process each athlete
    for (const athlete of athletes) {
      await processAthleteActivities(athlete.strava_id);
    }
    
    console.log('Completed Strava polling for missed activities');
  } catch (error) {
    console.error('Error in pollForMissedActivities:', error);
  }
}

/**
 * Process activities for a single athlete
 */
async function processAthleteActivities(athleteId: number): Promise<void> {
  try {
    console.log(`Checking for missed activities for athlete ${athleteId}`);
    
    // Get recent activities from Strava
    const activities = await getAthleteActivities(athleteId, {
      per_page: stravaSync.polling.activityLimit,
    });
    
    if (!activities || activities.length === 0) {
      console.log(`No recent activities found for athlete ${athleteId}`);
      return;
    }
    
    console.log(`Found ${activities.length} recent activities for athlete ${athleteId}`);
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    
    // Check each activity to see if it exists in our database
    for (const activity of activities) {
      const { data, error } = await supabaseAdmin
        .from('strava_activities')
        .select('strava_id')
        .eq('strava_id', activity.id)
        .maybeSingle();
      
      if (error) {
        console.error(`Error checking for activity ${activity.id}:`, error);
        continue;
      }
      
      // If activity doesn't exist in our database, sync it
      if (!data) {
        console.log(`Syncing missed activity ${activity.id} for athlete ${athleteId}`);
        await syncActivity(activity.id, athleteId);
      }
    }
    
    console.log(`Completed processing activities for athlete ${athleteId}`);
  } catch (error) {
    console.error(`Error processing activities for athlete ${athleteId}:`, error);
  }
}