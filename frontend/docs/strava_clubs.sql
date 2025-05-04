-- frontend/docs/strava_clubs.sql
-- Defines tables for Strava clubs and athlete membership.

-- -----------------------------------------------------
-- Table public.strava_clubs
-- Stores details about Strava clubs.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_clubs (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the club
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Club Details
    name text NOT NULL,
    profile_medium text, -- URL to medium profile picture
    profile text, -- URL to large profile picture
    cover_photo text, -- URL to cover photo
    cover_photo_small text, -- URL to small cover photo
    description text,
    activity_types jsonb, -- Array of strings, e.g., ["Cycling", "Running"] (Consider ENUM array if applicable)
    sport_type text, -- e.g., "cycling", "running", "triathlon", "other"
    city text,
    state text,
    country text,
    private boolean,
    member_count integer,
    featured boolean,
    verified boolean,
    url text, -- Club vanity URL on Strava
    membership text, -- Athlete's membership status: 'member', 'pending', 'null' (May vary per user)
    admin boolean, -- Is the authenticated athlete an admin? (May vary per user)
    owner boolean, -- Is the authenticated athlete the owner? (May vary per user)
    following_count integer, -- Number of members followed by the authenticated athlete (May vary per user)
    resource_state integer
);

COMMENT ON TABLE public.strava_clubs IS 'Stores detailed information about Strava clubs.';
COMMENT ON COLUMN public.strava_clubs.strava_id IS 'Strava''s unique identifier for the club (Primary Key).';
COMMENT ON COLUMN public.strava_clubs.activity_types IS 'JSONB array listing the types of activities the club focuses on.';
COMMENT ON COLUMN public.strava_clubs.membership IS 'Authenticated athlete''s membership status in this club (member, pending, null). Varies per user.';
COMMENT ON COLUMN public.strava_clubs.admin IS 'Indicates if the authenticated athlete is an admin of this club. Varies per user.';
COMMENT ON COLUMN public.strava_clubs.owner IS 'Indicates if the authenticated athlete is the owner of this club. Varies per user.';
COMMENT ON COLUMN public.strava_clubs.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this club.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_clubs_sport_type ON public.strava_clubs(sport_type);
CREATE INDEX IF NOT EXISTS idx_strava_clubs_city ON public.strava_clubs(city);
CREATE INDEX IF NOT EXISTS idx_strava_clubs_state ON public.strava_clubs(state);


-- -----------------------------------------------------
-- Table public.strava_athlete_clubs
-- Junction table to link athletes to the clubs they are members of.
-- This is necessary because club details like 'membership', 'admin', 'owner' are specific
-- to the relationship between an athlete and a club.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strava_athlete_clubs (
    athlete_id bigint NOT NULL,
    club_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp when the relationship was recorded in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp when the relationship was last updated in our DB

    -- Relationship specific details (fetched from athlete's club list endpoint)
    membership text, -- 'member', 'pending', etc.
    admin boolean,
    owner boolean,

    PRIMARY KEY (athlete_id, club_id), -- Composite primary key

    -- Foreign Key Constraints
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE, -- If athlete is deleted, remove their club memberships
    CONSTRAINT fk_club
        FOREIGN KEY(club_id)
        REFERENCES public.strava_clubs(strava_id)
        ON DELETE CASCADE -- If club is deleted, remove memberships
);

COMMENT ON TABLE public.strava_athlete_clubs IS 'Junction table linking Strava athletes to the clubs they belong to, storing relationship-specific details.';
COMMENT ON COLUMN public.strava_athlete_clubs.athlete_id IS 'Foreign key referencing the Strava athlete.';
COMMENT ON COLUMN public.strava_athlete_clubs.club_id IS 'Foreign key referencing the Strava club.';
COMMENT ON COLUMN public.strava_athlete_clubs.membership IS 'Athlete''s membership status in this specific club.';
COMMENT ON COLUMN public.strava_athlete_clubs.admin IS 'Indicates if the athlete is an admin of this specific club.';
COMMENT ON COLUMN public.strava_athlete_clubs.owner IS 'Indicates if the athlete is the owner of this specific club.';


-- Trigger function (assuming it exists from users.sql)
-- Apply trigger to update 'updated_at' on relevant tables
DROP TRIGGER IF EXISTS on_strava_clubs_updated ON public.strava_clubs;
CREATE TRIGGER on_strava_clubs_updated
BEFORE UPDATE ON public.strava_clubs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_strava_athlete_clubs_updated ON public.strava_athlete_clubs;
CREATE TRIGGER on_strava_athlete_clubs_updated
BEFORE UPDATE ON public.strava_athlete_clubs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();