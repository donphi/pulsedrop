-- frontend/docs/strava_segments.sql
-- Defines tables for Strava segments and segment efforts.

-- -----------------------------------------------------
-- Table public.strava_segments
-- Stores details about Strava segments.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_segments (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the segment
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Segment Details
    name text NOT NULL,
    activity_type text, -- e.g., "Ride", "Run"
    distance numeric, -- meters
    average_grade numeric, -- percent
    maximum_grade numeric, -- percent
    elevation_high numeric, -- meters
    elevation_low numeric, -- meters
    start_latlng jsonb, -- [latitude, longitude]
    end_latlng jsonb, -- [latitude, longitude]
    climb_category integer, -- 0-5 (0 is NC, 5 is HC)
    city text,
    state text,
    country text,
    private boolean,
    hazardous boolean,
    starred boolean, -- Has the authenticated user starred this segment? (May vary per user)
    map jsonb, -- Contains 'id', 'polyline', 'resource_state'
    total_elevation_gain numeric, -- meters
    effort_count integer, -- Total number of efforts on this segment
    athlete_count integer, -- Number of unique athletes who have attempted this segment
    star_count integer, -- Number of users who have starred this segment
    resource_state integer
);

COMMENT ON TABLE public.strava_segments IS 'Stores detailed information about Strava segments.';
COMMENT ON COLUMN public.strava_segments.strava_id IS 'Strava''s unique identifier for the segment (Primary Key).';
COMMENT ON COLUMN public.strava_segments.climb_category IS 'Climb category: 0 (NC) to 5 (HC).';
COMMENT ON COLUMN public.strava_segments.map IS 'JSONB object containing map details like polyline.';
COMMENT ON COLUMN public.strava_segments.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this segment.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_segments_activity_type ON public.strava_segments(activity_type);
CREATE INDEX IF NOT EXISTS idx_strava_segments_city ON public.strava_segments(city);
CREATE INDEX IF NOT EXISTS idx_strava_segments_state ON public.strava_segments(state);


-- -----------------------------------------------------
-- Table public.strava_segment_efforts
-- Stores details about an athlete's effort on a specific segment during an activity.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_segment_efforts (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the segment effort
    segment_id bigint NOT NULL, -- Foreign key to the segment
    activity_id bigint NOT NULL, -- Foreign key to the activity where the effort occurred
    athlete_id bigint NOT NULL, -- Foreign key to the athlete who made the effort
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Effort Details
    name text, -- Name of the segment (denormalized for convenience)
    elapsed_time integer NOT NULL, -- seconds
    moving_time integer NOT NULL, -- seconds
    start_date timestamp with time zone NOT NULL,
    start_date_local timestamp with time zone NOT NULL,
    distance numeric, -- meters (should match segment distance)
    start_index integer, -- Start index in the activity stream
    end_index integer, -- End index in the activity stream
    average_cadence numeric,
    average_watts numeric, -- Cycling power
    device_watts boolean,
    average_heartrate numeric,
    max_heartrate integer,
    kom_rank integer, -- King/Queen of the Mountain rank (1-10, null otherwise)
    pr_rank integer, -- Personal Record rank (1-3, null otherwise)
    achievements jsonb, -- Array of achievement details (e.g., KOM, CR, PR, rank)
    hidden boolean, -- Is this effort hidden by the athlete?
    resource_state integer,

    -- Foreign Key Constraints
    CONSTRAINT fk_segment
        FOREIGN KEY(segment_id)
        REFERENCES public.strava_segments(strava_id)
        ON DELETE CASCADE, -- If the segment is deleted, remove efforts on it
    CONSTRAINT fk_activity
        FOREIGN KEY(activity_id)
        REFERENCES public.strava_activities(strava_id)
        ON DELETE CASCADE, -- If the activity is deleted, remove its efforts
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their efforts
);

COMMENT ON TABLE public.strava_segment_efforts IS 'Stores details about athlete efforts on Strava segments within activities.';
COMMENT ON COLUMN public.strava_segment_efforts.strava_id IS 'Strava''s unique identifier for the segment effort (Primary Key).';
COMMENT ON COLUMN public.strava_segment_efforts.segment_id IS 'Foreign key referencing the Strava segment.';
COMMENT ON COLUMN public.strava_segment_efforts.activity_id IS 'Foreign key referencing the Strava activity during which the effort occurred.';
COMMENT ON COLUMN public.strava_segment_efforts.athlete_id IS 'Foreign key referencing the athlete who performed the effort.';
COMMENT ON COLUMN public.strava_segment_efforts.kom_rank IS 'King/Queen of the Mountain rank (1-10) for this effort, if applicable.';
COMMENT ON COLUMN public.strava_segment_efforts.pr_rank IS 'Personal Record rank (1-3) for this effort, if applicable.';
COMMENT ON COLUMN public.strava_segment_efforts.achievements IS 'JSONB array storing details about achievements earned on this effort.';
COMMENT ON COLUMN public.strava_segment_efforts.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this effort.';


-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_segment_id ON public.strava_segment_efforts(segment_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_activity_id ON public.strava_segment_efforts(activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_athlete_id ON public.strava_segment_efforts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_start_date ON public.strava_segment_efforts(start_date);


-- Trigger function (assuming it exists from users.sql)
-- Apply trigger to update 'updated_at' on relevant tables
DROP TRIGGER IF EXISTS on_strava_segments_updated ON public.strava_segments;
CREATE TRIGGER on_strava_segments_updated
BEFORE UPDATE ON public.strava_segments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_strava_segment_efforts_updated ON public.strava_segment_efforts;
CREATE TRIGGER on_strava_segment_efforts_updated
BEFORE UPDATE ON public.strava_segment_efforts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();