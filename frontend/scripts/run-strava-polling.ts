/**
 * Script to run the Strava polling function
 * This can be executed as a scheduled task (e.g., via cron)
 * 
 * For cron setup, use something like:
 * Run every 4 hours: At minute 0 of every 4th hour
 */

import { pollForMissedActivities } from '../lib/stravaPolling';

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

// Run the main function
main().catch(error => {
  console.error('Unhandled error in Strava polling task:', error);
  process.exit(1);
});