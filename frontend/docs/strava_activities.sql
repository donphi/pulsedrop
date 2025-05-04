-- frontend/docs/strava_activities.sql
-- Defines tables related to Strava activities: main activity data, laps, streams, and photos.

-- -----------------------------------------------------
-- Table public.strava_activities
-- Stores detailed information about individual Strava activities.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_activities (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the activity
    athlete_id bigint NOT NULL, -- Foreign key to the athlete who performed the activity
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Activity Details
    name text NOT NULL,
    description text,
    distance numeric, -- meters
    moving_time integer, -- seconds
    elapsed_time integer, -- seconds
    total_elevation_gain numeric, -- meters
    elev_high numeric, -- meters
    elev_low numeric, -- meters
    activity_type text NOT NULL, -- e.g., Run, Ride, Swim, etc. (Consider ENUM type if list is fixed)
    sport_type text NOT NULL, -- More specific sport type, e.g., RoadRun, MountainBikeRide
    start_date timestamp with time zone NOT NULL, -- Activity start time (local)
    start_date_local timestamp with time zone NOT NULL, -- Activity start time (local)
    timezone text, -- e.g., "(GMT-08:00) America/Los_Angeles"
    utc_offset numeric, -- Offset in seconds from UTC

    start_latlng jsonb, -- [latitude, longitude]
    end_latlng jsonb, -- [latitude, longitude]
    location_city text,
    location_state text,
    location_country text,
    achievement_count integer,
    kudos_count integer,
    comment_count integer,
    athlete_count integer, -- Number of athletes on the activity (group activities)
    photo_count integer,
    total_photo_count integer, -- Includes photos from other athletes in the group
    map jsonb, -- Contains 'id', 'summary_polyline', 'resource_state'
    trainer boolean, -- Was this activity recorded on a trainer?
    commute boolean, -- Was this activity tagged as a commute?
    manual boolean, -- Was this activity created manually?
    private boolean, -- Is this activity private?
    flagged boolean, -- Has this activity been flagged?
    visibility text, -- 'everyone', 'followers_only', 'only_me'
    gear_id text, -- Foreign key to the gear used (can be null)
    average_speed numeric, -- meters per second
    max_speed numeric, -- meters per second
    average_cadence numeric, -- steps per minute (running) or RPM (cycling)
    average_temp integer, -- degrees Celsius
    average_watts numeric, -- Cycling power
    max_watts integer, -- Cycling power
    weighted_average_watts integer, -- Cycling power
    kilojoules numeric, -- Cycling energy expenditure
    device_watts boolean, -- Was power measured by a device?
    has_heartrate boolean,
    average_heartrate numeric, -- beats per minute
    max_heartrate integer, -- beats per minute
    calories numeric, -- Estimated calories burned
    suffer_score integer, -- Strava's suffer score
    has_kudoed boolean, -- Has the authenticated athlete kudoed this activity?
    workout_type integer, -- e.g., 0: Default, 1: Race, 2: Long Run, 3: Workout (running); 10: Race, 11: Workout, 12: Ride (cycling)
    device_name text,
    embed_token text, -- For embedding Strava activity widgets
    external_id text, -- ID from external source (e.g., Garmin Connect)
    upload_id bigint, -- Strava upload ID
    upload_id_str text,
    resource_state integer, -- 2: summary, 3: detailed

    -- Foreign Key Constraints
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE, -- If the athlete is deleted, remove their activities
    CONSTRAINT fk_gear
        FOREIGN KEY(gear_id)
        REFERENCES public.strava_gear(strava_id)
        ON DELETE SET NULL -- If gear is deleted, just nullify the reference
);

COMMENT ON TABLE public.strava_activities IS 'Stores detailed information about individual Strava activities.';
COMMENT ON COLUMN public.strava_activities.strava_id IS 'Strava''s unique identifier for the activity (Primary Key).';
COMMENT ON COLUMN public.strava_activities.athlete_id IS 'Foreign key referencing the athlete who performed this activity.';
COMMENT ON COLUMN public.strava_activities.activity_type IS 'Main type of activity (e.g., Run, Ride). Consider using an ENUM.';
COMMENT ON COLUMN public.strava_activities.sport_type IS 'More specific sport type provided by Strava.';
COMMENT ON COLUMN public.strava_activities.map IS 'JSONB object containing map details like summary polyline.';
COMMENT ON COLUMN public.strava_activities.gear_id IS 'Foreign key referencing the gear used for this activity.';
COMMENT ON COLUMN public.strava_activities.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this activity.';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_strava_activities_athlete_id ON public.strava_activities(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_start_date ON public.strava_activities(start_date);
CREATE INDEX IF NOT EXISTS idx_strava_activities_activity_type ON public.strava_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_strava_activities_gear_id ON public.strava_activities(gear_id);


-- -----------------------------------------------------
-- Table public.strava_activity_laps
-- Stores lap data associated with a Strava activity.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_activity_laps (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the lap
    activity_id bigint NOT NULL, -- Foreign key to the parent activity
    athlete_id bigint NOT NULL, -- Foreign key to the athlete (denormalized for easier access)
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Lap Details
    name text,
    lap_index integer NOT NULL,
    split integer, -- Split number (relevant for specific lap types)
    start_index integer, -- Start index in the activity stream
    end_index integer, -- End index in the activity stream
    elapsed_time integer NOT NULL, -- seconds
    moving_time integer NOT NULL, -- seconds
    start_date timestamp with time zone NOT NULL,
    start_date_local timestamp with time zone NOT NULL,
    distance numeric, -- meters
    average_speed numeric, -- m/s
    max_speed numeric, -- m/s
    total_elevation_gain numeric, -- meters
    average_cadence numeric, -- rpm or spm
    average_watts numeric, -- Cycling power
    device_watts boolean,
    average_heartrate numeric, -- bpm
    max_heartrate integer, -- bpm
    pace_zone integer, -- Running specific pace zone
    resource_state integer,

    -- Foreign Key Constraints
    CONSTRAINT fk_activity
        FOREIGN KEY(activity_id)
        REFERENCES public.strava_activities(strava_id)
        ON DELETE CASCADE, -- If the activity is deleted, remove its laps
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their laps
);

COMMENT ON TABLE public.strava_activity_laps IS 'Stores lap data for Strava activities.';
COMMENT ON COLUMN public.strava_activity_laps.strava_id IS 'Strava''s unique identifier for the lap (Primary Key).';
COMMENT ON COLUMN public.strava_activity_laps.activity_id IS 'Foreign key referencing the parent Strava activity.';
COMMENT ON COLUMN public.strava_activity_laps.athlete_id IS 'Denormalized foreign key referencing the athlete.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_activity_laps_activity_id ON public.strava_activity_laps(activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_activity_laps_athlete_id ON public.strava_activity_laps(athlete_id);


-- -----------------------------------------------------
-- Table public.strava_activity_streams
-- Stores time-series data (streams) for a Strava activity.
-- Performance Consideration: This table can become very large.
-- Storing streams as JSONB is flexible but querying specific points can be inefficient.
-- Alternatives: Store each stream type in its own column (wide table), or use TimescaleDB extension if available.
-- For simplicity here, we use JSONB, assuming detailed stream analysis might happen elsewhere or less frequently.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_activity_streams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Internal primary key
    activity_id bigint NOT NULL UNIQUE, -- Foreign key to the parent activity (assuming one stream set per activity)
    athlete_id bigint NOT NULL, -- Foreign key to the athlete (denormalized)
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_fetched_at timestamp with time zone,

    -- Stream Data (as JSONB arrays)
    time jsonb, -- Array of integers (seconds since activity start)
    latlng jsonb, -- Array of [lat, lng] pairs
    distance jsonb, -- Array of floats (meters)
    altitude jsonb, -- Array of floats (meters)
    velocity_smooth jsonb, -- Array of floats (m/s)
    heartrate jsonb, -- Array of integers (bpm)
    cadence jsonb, -- Array of integers (rpm or spm)
    watts jsonb, -- Array of integers (cycling power)
    temp jsonb, -- Array of integers (Celsius)
    moving jsonb, -- Array of booleans
    grade_smooth jsonb, -- Array of floats (percent grade)

    original_size integer, -- Number of data points in the original stream set
    resolution text, -- 'low', 'medium', or 'high'
    series_type text, -- 'time' or 'distance'

    -- Foreign Key Constraints
    CONSTRAINT fk_activity
        FOREIGN KEY(activity_id)
        REFERENCES public.strava_activities(strava_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE public.strava_activity_streams IS 'Stores time-series stream data for Strava activities. Can become very large.';
COMMENT ON COLUMN public.strava_activity_streams.activity_id IS 'Foreign key referencing the parent Strava activity. Marked UNIQUE assuming one stream set per activity.';
COMMENT ON COLUMN public.strava_activity_streams.athlete_id IS 'Denormalized foreign key referencing the athlete.';
COMMENT ON COLUMN public.strava_activity_streams.latlng IS 'Stream data for latitude and longitude as a JSONB array of [lat, lng] pairs.';
COMMENT ON COLUMN public.strava_activity_streams.last_fetched_at IS 'Timestamp of the last successful stream data synchronization from the Strava API.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_activity_streams_activity_id ON public.strava_activity_streams(activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_activity_streams_athlete_id ON public.strava_activity_streams(athlete_id);


-- -----------------------------------------------------
-- Table public.strava_activity_photos
-- Stores metadata about photos associated with a Strava activity.
-- Note: Does not store the photo binary data itself, only references.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_activity_photos (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the photo (part of the activity payload, might not be globally unique across all photos)
    activity_id bigint NOT NULL, -- Foreign key to the parent activity
    athlete_id bigint NOT NULL, -- Foreign key to the athlete (denormalized)
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Photo Metadata
    unique_id text UNIQUE, -- Strava's globally unique photo ID (if available, preferred over strava_id as PK if guaranteed unique)
    caption text,
    type text, -- 'InstagramPhoto' or 'StravaPhoto'
    source integer, -- 1: Strava, 2: Instagram
    uploaded_at timestamp with time zone,
    location jsonb, -- [latitude, longitude]
    urls jsonb, -- JSON object containing different size URLs, e.g., {"100": "url1", "600": "url2"}
    sizes jsonb, -- JSON object describing sizes, e.g., {"100": [width, height], "600": [width, height]}
    default_photo boolean, -- Is this the primary photo for the activity?
    resource_state integer,

    -- Foreign Key Constraints
    CONSTRAINT fk_activity
        FOREIGN KEY(activity_id)
        REFERENCES public.strava_activities(strava_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE public.strava_activity_photos IS 'Stores metadata about photos linked to Strava activities.';
COMMENT ON COLUMN public.strava_activity_photos.strava_id IS 'Strava''s identifier for the photo within the activity context (Primary Key).';
COMMENT ON COLUMN public.strava_activity_photos.activity_id IS 'Foreign key referencing the parent Strava activity.';
COMMENT ON COLUMN public.strava_activity_photos.athlete_id IS 'Denormalized foreign key referencing the athlete.';
COMMENT ON COLUMN public.strava_activity_photos.unique_id IS 'Potentially globally unique identifier for the photo from Strava.';
COMMENT ON COLUMN public.strava_activity_photos.urls IS 'JSONB object containing URLs for different photo sizes.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_activity_photos_activity_id ON public.strava_activity_photos(activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_activity_photos_athlete_id ON public.strava_activity_photos(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_activity_photos_unique_id ON public.strava_activity_photos(unique_id);


-- Trigger function (assuming it exists from users.sql)
-- Apply trigger to update 'updated_at' on relevant tables
DROP TRIGGER IF EXISTS on_strava_activities_updated ON public.strava_activities;
CREATE TRIGGER on_strava_activities_updated
BEFORE UPDATE ON public.strava_activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_strava_activity_laps_updated ON public.strava_activity_laps;
CREATE TRIGGER on_strava_activity_laps_updated
BEFORE UPDATE ON public.strava_activity_laps
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_strava_activity_streams_updated ON public.strava_activity_streams;
CREATE TRIGGER on_strava_activity_streams_updated
BEFORE UPDATE ON public.strava_activity_streams
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_strava_activity_photos_updated ON public.strava_activity_photos;
CREATE TRIGGER on_strava_activity_photos_updated
BEFORE UPDATE ON public.strava_activity_photos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();