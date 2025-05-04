-- frontend/docs/strava_gear.sql
-- Defines the table for storing information about an athlete's gear (bikes, shoes).

CREATE TABLE IF NOT EXISTS public.strava_gear (
    strava_id text PRIMARY KEY, -- Strava's unique identifier for the gear (can be alphanumeric like 'b12345' or 'g67890')
    athlete_id bigint NOT NULL, -- Foreign key to the athlete who owns the gear
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Gear Details
    name text NOT NULL, -- Gear name (e.g., "Cannondale Synapse")
    nickname text, -- User-defined nickname
    primary_gear boolean NOT NULL DEFAULT false, -- Indicates if this is the primary bike or shoes
    retired boolean NOT NULL DEFAULT false, -- Indicates if the gear has been retired by the athlete
    distance numeric DEFAULT 0, -- Total distance recorded with this gear in meters
    converted_distance numeric, -- Distance in user's preferred units (consider calculating on read instead?)
    brand_name text,
    model_name text,
    frame_type text, -- Specific to bikes (e.g., road, mountain, tt)
    description text,
    resource_state integer, -- Strava's resource state (e.g., 2 for summary, 3 for detailed)

    -- Foreign Key Constraint
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their gear too
);

COMMENT ON TABLE public.strava_gear IS 'Stores details about Strava athletes'' gear (bikes and shoes).';
COMMENT ON COLUMN public.strava_gear.strava_id IS 'Strava''s unique identifier for the gear item (Primary Key). Can be alphanumeric.';
COMMENT ON COLUMN public.strava_gear.athlete_id IS 'Foreign key referencing the athlete who owns this gear.';
COMMENT ON COLUMN public.strava_gear.primary_gear IS 'Whether this gear is marked as primary by the athlete.';
COMMENT ON COLUMN public.strava_gear.distance IS 'Total distance recorded with this gear, in meters.';
COMMENT ON COLUMN public.strava_gear.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this gear item.';

-- Index on athlete_id for efficient lookup of gear per athlete
CREATE INDEX IF NOT EXISTS idx_strava_gear_athlete_id ON public.strava_gear(athlete_id);

-- Trigger to update updated_at timestamp
-- Assumes the function handle_updated_at exists (created in users.sql)
DROP TRIGGER IF EXISTS on_strava_gear_updated ON public.strava_gear;
CREATE TRIGGER on_strava_gear_updated
BEFORE UPDATE ON public.strava_gear
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();