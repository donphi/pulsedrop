-- frontend/docs/strava_athlete.sql
-- Defines the table for storing detailed Strava athlete profile information.

CREATE TABLE IF NOT EXISTS public.strava_athletes (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the athlete
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Profile Information
    username text UNIQUE, -- Athlete's Strava username
    firstname text,
    lastname text,
    bio text,
    city text,
    state text,
    country text,
    sex character(1), -- 'M', 'F', or NULL
    profile_medium text, -- URL to medium profile picture
    profile text, -- URL to large profile picture
    friend boolean, -- Deprecated by Strava, but might still appear
    follower boolean, -- Deprecated by Strava, but might still appear
    premium boolean, -- Athlete is a Strava premium member
    summit boolean, -- Athlete is a Strava subscriber (replaces premium)
    strava_created_at timestamp with time zone, -- Athlete's account creation date on Strava
    strava_updated_at timestamp with time zone, -- Athlete's profile last update date on Strava
    badge_type_id integer,
    weight numeric, -- Athlete's weight in kilograms
    profile_original text, -- URL to original profile picture (if available)

    -- Relationships (Counts - might be useful for quick display)
    follower_count integer,
    friend_count integer,
    mutual_friend_count integer,
    athlete_type integer, -- 0: cyclist, 1: runner
    date_preference text, -- e.g., "%m/%d/%Y"
    measurement_preference text, -- 'feet' or 'meters'
    ftp integer, -- Functional Threshold Power

    -- OAuth details (Store securely, consider encryption or separate handling if needed)
    -- These might be better stored elsewhere depending on security requirements,
    -- but included here for completeness based on potential API data.
    -- Ensure appropriate RLS policies if storing sensitive tokens here.
    strava_access_token text,
    strava_refresh_token text,
    strava_token_expires_at timestamp with time zone,
    strava_scope text -- Comma-separated list of granted scopes

    -- Foreign key constraint linking back to the application user
    -- This assumes a one-to-one or one-to-many (if one user manages multiple Strava accounts?) relationship
    -- Adjust based on your application logic. If one app user maps to one Strava user,
    -- the UNIQUE constraint on users.strava_athlete_id is sufficient.
    -- user_id uuid REFERENCES public.users(id) ON DELETE CASCADE -- Optional: Link back to app user
);

COMMENT ON TABLE public.strava_athletes IS 'Stores detailed profile information for Strava athletes linked to the application.';
COMMENT ON COLUMN public.strava_athletes.strava_id IS 'Strava''s unique identifier for the athlete. Primary Key.';
COMMENT ON COLUMN public.strava_athletes.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this athlete.';
COMMENT ON COLUMN public.strava_athletes.summit IS 'Indicates if the athlete is a Strava subscriber (formerly premium).';
COMMENT ON COLUMN public.strava_athletes.ftp IS 'Athlete''s Functional Threshold Power (cycling).';
COMMENT ON COLUMN public.strava_athletes.strava_access_token IS 'OAuth2 access token for Strava API. Handle with extreme care due to sensitivity.';
COMMENT ON COLUMN public.strava_athletes.strava_refresh_token IS 'OAuth2 refresh token for Strava API. Handle with extreme care due to sensitivity.';
COMMENT ON COLUMN public.strava_athletes.strava_token_expires_at IS 'Expiration timestamp for the Strava access token.';
COMMENT ON COLUMN public.strava_athletes.strava_scope IS 'OAuth scopes granted by the user.';


-- Index for potential lookups by username
CREATE INDEX IF NOT EXISTS idx_strava_athletes_username ON public.strava_athletes(username);

-- Trigger to update updated_at timestamp
-- Assumes the function handle_updated_at exists (created in users.sql)
DROP TRIGGER IF EXISTS on_strava_athletes_updated ON public.strava_athletes;
CREATE TRIGGER on_strava_athletes_updated
BEFORE UPDATE ON public.strava_athletes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add the foreign key constraint to the users table now that strava_athletes exists
-- This ensures referential integrity: users.strava_athlete_id must point to a valid strava_athletes.strava_id
ALTER TABLE public.users
ADD CONSTRAINT fk_strava_athlete
FOREIGN KEY (strava_athlete_id)
REFERENCES public.strava_athletes(strava_id)
ON DELETE SET NULL; -- If a Strava athlete is deleted (unlikely), nullify the link in users table