-- frontend/docs/strava_heart_rate.sql
-- Defines a table for storing granular heart rate stream data points from Strava activities.
-- This allows for more efficient querying and analysis of heart rate over time compared to storing it in JSONB.

-- -----------------------------------------------------
-- Table public.strava_activity_hr_stream_points
-- Stores individual heart rate data points from an activity's time-series stream.
-- Note: This table can become very large, containing one row per data point in the heart rate stream.
-- Note: Standard Strava API streams typically provide HR values, not raw beat-to-beat (RR) intervals needed for precise HRV calculation.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_activity_hr_stream_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Internal unique identifier for the data point row
    activity_id bigint NOT NULL, -- Foreign key to the parent activity
    athlete_id bigint NOT NULL, -- Foreign key to the athlete (denormalized for easier access/RLS)
    time_offset integer NOT NULL, -- Time offset in seconds from the start of the activity
    heart_rate integer, -- Heart rate in beats per minute (BPM) at this time offset. Can be null if HR data wasn't available for this point.
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB

    -- Composite unique constraint to prevent duplicate entries for the same time point in an activity
    CONSTRAINT unique_hr_point_per_activity UNIQUE (activity_id, time_offset),

    -- Foreign Key Constraints
    CONSTRAINT fk_activity
        FOREIGN KEY(activity_id)
        REFERENCES public.strava_activities(strava_id)
        ON DELETE CASCADE, -- If the activity is deleted, remove its HR points
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their HR points
);

COMMENT ON TABLE public.strava_activity_hr_stream_points IS 'Stores individual heart rate data points from Strava activity streams for detailed analysis. Can become very large.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.activity_id IS 'Foreign key referencing the parent Strava activity.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.athlete_id IS 'Denormalized foreign key referencing the athlete.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.time_offset IS 'Time offset in seconds from the start of the activity for this data point.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.heart_rate IS 'Heart rate in beats per minute (BPM) at the specified time offset.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.unique_hr_point_per_activity IS 'Ensures only one heart rate value exists per time offset within a single activity.';


-- Indexes for common query patterns
-- Indexing time_offset along with activity_id is crucial for time-series queries
CREATE INDEX IF NOT EXISTS idx_strava_hr_points_activity_time ON public.strava_activity_hr_stream_points(activity_id, time_offset);
CREATE INDEX IF NOT EXISTS idx_strava_hr_points_athlete_activity ON public.strava_activity_hr_stream_points(athlete_id, activity_id);

-- Note: No updated_at trigger is added here as these records represent immutable points in time from the stream.
-- If stream data is re-fetched and potentially corrected, the strategy would likely be to delete existing points for the activity and insert the new ones.