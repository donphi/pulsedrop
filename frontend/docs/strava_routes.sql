-- frontend/docs/strava_routes.sql
-- Defines the table for storing Strava routes created by athletes.
-- GDPR Compliant: Contains location data requiring protection

CREATE TABLE IF NOT EXISTS public.strava_routes (
    strava_id bigint PRIMARY KEY, -- Strava's unique identifier for the route
    athlete_id bigint NOT NULL, -- Foreign key to the athlete who created the route
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    last_fetched_at timestamp with time zone, -- Timestamp of last successful fetch from Strava API

    -- Route Details
    name text NOT NULL,
    description text,
    type integer CHECK (type IN (1, 2)), -- 1: Ride, 2: Run
    sub_type integer CHECK (sub_type IN (1, 2, 3, 4, 5)), -- 1: Road, 2: MTB, 3: CX, 4: Trail, 5: Mixed
    private boolean,
    starred boolean, -- Has the authenticated user starred this route?
    timestamp bigint, -- Creation timestamp (epoch seconds) from Strava
    distance numeric CHECK (distance IS NULL OR distance >= 0), -- meters
    elevation_gain numeric CHECK (elevation_gain IS NULL OR elevation_gain >= 0), -- meters
    estimated_moving_time integer CHECK (estimated_moving_time IS NULL OR estimated_moving_time >= 0), -- seconds
    map jsonb, -- Contains 'id', 'summary_polyline', 'resource_state' - sensitive location data
    map_urls jsonb, -- Contains URLs for route map images - sensitive location data
    segments jsonb, -- Array of segment summaries included in the route (consider normalizing if needed)
    resource_state integer,
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When route data should be purged/anonymized
    is_anonymized boolean DEFAULT false, -- Flag to indicate if location data has been anonymized

    -- Foreign Key Constraint
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their routes
);

COMMENT ON TABLE public.strava_routes IS 'Stores details about routes created by Strava athletes. Contains sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_routes.strava_id IS 'Strava''s unique identifier for the route (Primary Key).';
COMMENT ON COLUMN public.strava_routes.athlete_id IS 'Foreign key referencing the athlete who created this route.';
COMMENT ON COLUMN public.strava_routes.type IS 'Type of route: 1 for Ride, 2 for Run.';
COMMENT ON COLUMN public.strava_routes.sub_type IS 'Sub-type of route: 1 (Road), 2 (MTB), 3 (CX), 4 (Trail), 5 (Mixed).';
COMMENT ON COLUMN public.strava_routes.map IS 'JSONB object containing map details like summary polyline. Contains sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_routes.map_urls IS 'JSONB object containing URLs for route map images. Contains sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_routes.segments IS 'JSONB array of segment summaries included in the route. Consider normalization if detailed segment info is frequently queried.';
COMMENT ON COLUMN public.strava_routes.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this route.';
COMMENT ON COLUMN public.strava_routes.data_retention_end_date IS 'Date after which route data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_routes.is_anonymized IS 'Indicates whether location data has been anonymized for GDPR compliance.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_routes_athlete_id ON public.strava_routes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_routes_type ON public.strava_routes(type);
CREATE INDEX IF NOT EXISTS idx_strava_routes_starred ON public.strava_routes(starred);
CREATE INDEX IF NOT EXISTS idx_strava_routes_data_retention ON public.strava_routes(data_retention_end_date);

-- Trigger function (assuming it exists from users.sql)
-- Apply trigger to update 'updated_at'
DROP TRIGGER IF EXISTS on_strava_routes_updated ON public.strava_routes;
CREATE TRIGGER on_strava_routes_updated
BEFORE UPDATE ON public.strava_routes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.strava_routes ENABLE ROW LEVEL SECURITY;

-- **CRITICAL: Service role bypass**
CREATE POLICY "Service role bypass"
ON public.strava_routes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies
-- Athletes can view their own routes, admins and researchers can view all routes
CREATE POLICY "Athletes can view their own routes"
ON public.strava_routes
FOR SELECT
TO authenticated
USING (
  athlete_id IN (
    SELECT strava_id FROM public.strava_athletes
    WHERE strava_id IN (
      SELECT strava_athlete_id FROM public.users
      WHERE id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);

-- Athletes can update their own routes, admins can update all routes
CREATE POLICY "Athletes can update their own routes"
ON public.strava_routes
FOR UPDATE
TO authenticated
USING (
  athlete_id IN (
    SELECT strava_id FROM public.strava_athletes
    WHERE strava_id IN (
      SELECT strava_athlete_id FROM public.users
      WHERE id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Public routes can be viewed by anyone if shared by the athlete
CREATE POLICY "Public routes can be viewed by anyone"
ON public.strava_routes
FOR SELECT
TO authenticated, anon
USING (private = false AND is_anonymized = false);

-- Only admins can delete routes
CREATE POLICY "Only admins can delete routes"
ON public.strava_routes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to anonymize route location data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_route_location_data(route_id_param bigint)
RETURNS void AS $$
BEGIN
  -- Anonymize route location data
  UPDATE public.strava_routes
  SET 
    map = jsonb_build_object('id', (map->>'id'), 'summary_polyline', NULL, 'resource_state', 1),
    map_urls = NULL,
    is_anonymized = true
  WHERE strava_id = route_id_param;
  
  -- Log the anonymization
  INSERT INTO public.data_processing_logs (
    event_type, 
    description
  ) VALUES (
    'route_location_data_anonymized', 
    format('Location data anonymized for route %s', route_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_route_location_data IS 'Anonymizes route location data for GDPR compliance.';

-- Function to handle data retention for routes
CREATE OR REPLACE FUNCTION public.process_route_data_retention()
RETURNS INTEGER AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize routes that have reached their retention period
  UPDATE public.strava_routes
  SET 
    map = jsonb_build_object('id', (map->>'id'), 'summary_polyline', NULL, 'resource_state', 1),
    map_urls = NULL,
    is_anonymized = true
  WHERE 
    data_retention_end_date IS NOT NULL AND
    data_retention_end_date <= CURRENT_DATE AND
    is_anonymized = false;
    
  GET DIAGNOSTICS v_processed = ROW_COUNT;
  
  -- Log the retention processing
  IF v_processed > 0 THEN
    INSERT INTO public.data_processing_logs (
      event_type, 
      description
    ) VALUES (
      'route_data_retention_processed', 
      format('Anonymized %s routes that reached retention period', v_processed)
    );
  END IF;
  
  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_route_data_retention IS 'Processes route data that has reached its retention period by anonymizing it.';

-- Create a view for route statistics without exposing sensitive location data
CREATE OR REPLACE VIEW public.route_statistics AS
SELECT
  strava_id,
  athlete_id,
  name,
  type,
  sub_type,
  distance,
  elevation_gain,
  estimated_moving_time,
  private,
  starred,
  created_at,
  updated_at
FROM
  public.strava_routes;

COMMENT ON VIEW public.route_statistics IS 'Provides route statistics without exposing sensitive location data.';