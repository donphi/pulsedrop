-- frontend/docs/strava_routes.sql
-- Defines the table for storing Strava routes created by athletes.

CREATE TABLE IF NOT EXISTS public.strava_routes (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the route
    athlete_id bigint NOT NULL, -- Foreign key to the athlete who created the route
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Route Details
    name text NOT NULL,
    description text,
    type integer, -- 1: Ride, 2: Run
    sub_type integer, -- 1: Road, 2: MTB, 3: CX, 4: Trail, 5: Mixed
    private boolean,
    starred boolean, -- Has the authenticated user starred this route?
    timestamp bigint, -- Creation timestamp (epoch seconds) from Strava
    distance numeric, -- meters
    elevation_gain numeric, -- meters
    estimated_moving_time integer, -- seconds
    map jsonb, -- Contains 'id', 'summary_polyline', 'resource_state'
    map_urls jsonb, -- Contains URLs for route map images
    segments jsonb, -- Array of segment summaries included in the route (consider normalizing if needed)
    resource_state integer,

    -- Foreign Key Constraint
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their routes
);

COMMENT ON TABLE public.strava_routes IS 'Stores details about routes created by Strava athletes.';
COMMENT ON COLUMN public.strava_routes.strava_id IS 'Strava''s unique identifier for the route (Primary Key).';
COMMENT ON COLUMN public.strava_routes.athlete_id IS 'Foreign key referencing the athlete who created this route.';
COMMENT ON COLUMN public.strava_routes.type IS 'Type of route: 1 for Ride, 2 for Run.';
COMMENT ON COLUMN public.strava_routes.sub_type IS 'Sub-type of route: 1 (Road), 2 (MTB), 3 (CX), 4 (Trail), 5 (Mixed).';
COMMENT ON COLUMN public.strava_routes.map IS 'JSONB object containing map details like summary polyline.';
COMMENT ON COLUMN public.strava_routes.segments IS 'JSONB array of segment summaries included in the route. Consider normalization if detailed segment info is frequently queried.';
COMMENT ON COLUMN public.strava_routes.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this route.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_routes_athlete_id ON public.strava_routes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_routes_type ON public.strava_routes(type);
CREATE INDEX IF NOT EXISTS idx_strava_routes_starred ON public.strava_routes(starred);


-- Trigger function (assuming it exists from users.sql)
-- Apply trigger to update 'updated_at'
DROP TRIGGER IF EXISTS on_strava_routes_updated ON public.strava_routes;
CREATE TRIGGER on_strava_routes_updated
BEFORE UPDATE ON public.strava_routes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();