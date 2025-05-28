import { supabaseAdmin } from './supabaseServiceRoleClient';
import { stravaSync } from './config';

/**
 * Strava API client for fetching data from the Strava API
 * Handles authentication, token refresh, and rate limiting
 */

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaAthlete {
  strava_id: number;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: string | null;
}

interface StravaActivitySummary {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    polyline?: string;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: string;
  flagged: boolean;
  gear_id: string | null;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  heartrate_opt_out?: boolean;
  display_hide_heartrate_option?: boolean;
  upload_id?: number;
  upload_id_str?: string;
  external_id?: string;
  from_accepted_tag?: boolean;
  pr_count?: number;
  total_photo_count?: number;
  has_kudoed?: boolean;
}

interface StravaActivityDetailed extends StravaActivitySummary {
  description: string;
  calories: number;
  perceived_exertion?: number;
  prefer_perceived_exertion?: boolean;
  segment_efforts?: any[];
  splits_metric?: any[];
  splits_standard?: any[];
  laps?: any[];
  best_efforts?: any[];
  photos?: {
    primary?: {
      id: number;
      unique_id: string;
      urls: Record<string, string>;
    };
    use_primary_photo: boolean;
    count: number;
  };
  device_name?: string;
  embed_token?: string;
  similar_activities?: {
    effort_count: number;
    average_speed: number;
    min_average_speed: number;
    mid_average_speed: number;
    max_average_speed: number;
    pr_rank?: number;
    frequency_milestone?: number;
    trend?: {
      speeds: number[];
      current_activity_index: number;
      min_speed: number;
      mid_speed: number;
      max_speed: number;
      direction: number;
    };
  };
  available_zones?: string[];
}

interface StravaStream {
  type: string;
  data: number[] | [number, number][];
  series_type: 'distance' | 'time';
  original_size: number;
  resolution: 'low' | 'medium' | 'high';
}

/**
 * Get athlete tokens from the database
 */
async function getAthleteTokens(athleteId: number): Promise<StravaTokens | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('strava_athletes')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('strava_id', athleteId)
    .single();

  if (error || !data) {
    console.error('Error fetching athlete tokens:', error);
    return null;
  }

  if (!data.strava_access_token || !data.strava_refresh_token || !data.strava_token_expires_at) {
    console.error('Athlete has incomplete token data');
    return null;
  }

  return {
    access_token: data.strava_access_token,
    refresh_token: data.strava_refresh_token,
    expires_at: new Date(data.strava_token_expires_at).getTime() / 1000
  };
}

/**
 * Check if a token is expired
 */
function isTokenExpired(expiresAt: number): boolean {
  // Add a 5-minute buffer to ensure we refresh before expiration
  const bufferTime = 5 * 60; // 5 minutes in seconds
  return Date.now() / 1000 >= expiresAt - bufferTime;
}

/**
 * Refresh an expired token
 */
async function refreshToken(athleteId: number, refreshToken: string): Promise<StravaTokens | null> {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID || '',
        client_secret: process.env.STRAVA_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update tokens in the database
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('strava_athletes')
        .update({
          strava_access_token: data.access_token,
          strava_refresh_token: data.refresh_token,
          strava_token_expires_at: new Date(data.expires_at * 1000).toISOString(),
        })
        .eq('strava_id', athleteId);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Make an authenticated request to the Strava API
 */
async function makeStravaRequest<T>(
  athleteId: number,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  params: Record<string, string | number | boolean> = {},
  retryCount = 0
): Promise<T | null> {
  try {
    // Get tokens
    let tokens = await getAthleteTokens(athleteId);
    if (!tokens) {
      throw new Error(`No tokens found for athlete ${athleteId}`);
    }

    // Refresh token if expired
    if (isTokenExpired(tokens.expires_at)) {
      const refreshedTokens = await refreshToken(athleteId, tokens.refresh_token);
      if (!refreshedTokens) {
        throw new Error(`Failed to refresh token for athlete ${athleteId}`);
      }
      tokens = refreshedTokens;
    }

    // Build URL with query parameters
    let url = `https://www.strava.com/api/v3${endpoint}`;
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }

    // Make request
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(params) : undefined,
      // Set timeout based on config
      signal: AbortSignal.timeout(stravaSync.api.requestTimeout),
    });

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount >= stravaSync.api.maxRetries) {
        throw new Error(`Rate limit exceeded after ${retryCount} retries`);
      }

      // Get retry-after header or use exponential backoff
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter 
        ? parseInt(retryAfter, 10) * 1000
        : stravaSync.api.baseRetryDelay * Math.pow(2, retryCount);
      
      console.log(`Rate limited, retrying in ${delay}ms (retry ${retryCount + 1}/${stravaSync.api.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeStravaRequest(athleteId, endpoint, method, params, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error making Strava API request to ${endpoint}:`, error);
    return null;
  }
}

/**
 * Get a list of activities for an athlete
 */
export async function getAthleteActivities(
  athleteId: number,
  params: {
    before?: number;
    after?: number;
    page?: number;
    per_page?: number;
  } = {}
): Promise<StravaActivitySummary[] | null> {
  return makeStravaRequest<StravaActivitySummary[]>(
    athleteId,
    '/athlete/activities',
    'GET',
    params
  );
}

/**
 * Get detailed activity data
 */
export async function getActivity(
  activityId: number,
  athleteId: number
): Promise<StravaActivityDetailed | null> {
  return makeStravaRequest<StravaActivityDetailed>(
    athleteId,
    `/activities/${activityId}`,
    'GET',
    { include_all_efforts: true }
  );
}

/**
 * Get activity streams (time-series data)
 */
export async function getActivityStreams(
  activityId: number,
  athleteId: number,
  types: string[] = ['time', 'heartrate', 'latlng', 'altitude', 'cadence', 'watts']
): Promise<Record<string, StravaStream> | null> {
  return makeStravaRequest<Record<string, StravaStream>>(
    athleteId,
    `/activities/${activityId}/streams`,
    'GET',
    {
      keys: types.join(','),
      key_by_type: true,
    }
  );
}

/**
 * Sync an activity from Strava to the database
 */
export async function syncActivity(activityId: number, athleteId: number): Promise<boolean> {
  try {
    // Get detailed activity data
    const activity = await getActivity(activityId, athleteId);
    if (!activity) {
      throw new Error(`Failed to fetch activity ${activityId}`);
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Store activity in database
    const { error: activityError } = await supabaseAdmin
      .from('strava_activities')
      .upsert({
        strava_id: activity.id,
        athlete_id: athleteId,
        name: activity.name,
        description: activity.description || '',
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        activity_type: activity.type,
        sport_type: activity.sport_type,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        timezone: activity.timezone,
        start_latlng: activity.start_latlng ? JSON.stringify(activity.start_latlng) : null,
        end_latlng: activity.end_latlng ? JSON.stringify(activity.end_latlng) : null,
        achievement_count: activity.achievement_count,
        kudos_count: activity.kudos_count,
        comment_count: activity.comment_count,
        athlete_count: activity.athlete_count,
        photo_count: activity.photo_count,
        map: activity.map,
        trainer: activity.trainer,
        commute: activity.commute,
        manual: activity.manual,
        private: activity.private,
        visibility: activity.visibility,
        flagged: activity.flagged,
        gear_id: activity.gear_id,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_cadence: activity.average_cadence,
        average_watts: activity.average_watts,
        weighted_average_watts: activity.weighted_average_watts,
        kilojoules: activity.kilojoules,
        device_watts: activity.device_watts,
        has_heartrate: activity.has_heartrate,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        heartrate_opt_out: activity.heartrate_opt_out,
        display_hide_heartrate_option: activity.display_hide_heartrate_option,
        upload_id: activity.upload_id,
        external_id: activity.external_id,
        from_accepted_tag: activity.from_accepted_tag,
        pr_count: activity.pr_count,
        total_photo_count: activity.total_photo_count,
        has_kudoed: activity.has_kudoed,
        device_name: activity.device_name,
        embed_token: activity.embed_token,
        calories: activity.calories,
        perceived_exertion: activity.perceived_exertion,
        prefer_perceived_exertion: activity.prefer_perceived_exertion,
      }, { onConflict: 'strava_id' });

    if (activityError) {
      throw new Error(`Failed to store activity: ${activityError.message}`);
    }

    // If activity has heart rate data and we're configured to fetch streams
    if (activity.has_heartrate && stravaSync.activity.fetchStreams) {
      // Get activity streams
      const streams = await getActivityStreams(
        activityId, 
        athleteId,
        stravaSync.activity.streamTypes
      );

      if (streams) {
        // Store streams in database
        const { error: streamsError } = await supabaseAdmin
          .from('strava_activity_streams')
          .upsert({
            activity_id: activity.id,
            time: streams.time?.data || null,
            distance: streams.distance?.data || null,
            latlng: streams.latlng?.data || null,
            altitude: streams.altitude?.data || null,
            velocity_smooth: streams.velocity_smooth?.data || null,
            heartrate: streams.heartrate?.data || null,
            cadence: streams.cadence?.data || null,
            watts: streams.watts?.data || null,
            temp: streams.temp?.data || null,
            moving: streams.moving?.data || null,
            grade_smooth: streams.grade_smooth?.data || null,
          }, { onConflict: 'activity_id' });

        if (streamsError) {
          console.error(`Failed to store activity streams: ${streamsError.message}`);
        }

        // If we're configured to process heart rate data separately
        if (stravaSync.activity.processHeartRate && streams.heartrate && streams.time) {
          const heartRateData = streams.heartrate.data as number[];
          const timeData = streams.time.data as number[];

          if (heartRateData.length === timeData.length) {
            // Prepare heart rate points for bulk insert
            const hrPoints = timeData.map((time, index) => ({
              activity_id: activity.id,
              athlete_id: athleteId,
              time_offset: time,
              heart_rate: heartRateData[index],
            }));

            // Delete existing heart rate points for this activity
            await supabaseAdmin
              .from('strava_activity_hr_stream_points')
              .delete()
              .eq('activity_id', activity.id);

            // Insert new heart rate points in batches to avoid hitting size limits
            const batchSize = 1000;
            for (let i = 0; i < hrPoints.length; i += batchSize) {
              const batch = hrPoints.slice(i, i + batchSize);
              const { error: hrError } = await supabaseAdmin
                .from('strava_activity_hr_stream_points')
                .insert(batch);

              if (hrError) {
                console.error(`Failed to store heart rate points (batch ${i / batchSize}): ${hrError.message}`);
              }
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error syncing activity ${activityId}:`, error);
    return false;
  }
}