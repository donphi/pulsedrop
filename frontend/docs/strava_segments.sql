-- frontend/docs/strava_segments.sql
-- Defines tables for Strava segments and segment efforts.
-- GDPR Compliant: Contains performance data requiring protection

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
    distance numeric CHECK (distance IS NULL OR distance >= 0), -- meters
    average_grade numeric, -- percent
    maximum_grade numeric, -- percent
    elevation_high numeric, -- meters
    elevation_low numeric, -- meters
    start_latlng jsonb, -- [latitude, longitude] - sensitive location data
    end_latlng jsonb, -- [latitude, longitude] - sensitive location data
    climb_category integer CHECK (climb_category >= 0 AND climb_category <= 5), -- 0-5 (0 is NC, 5 is HC)
    city text,
    state text,
    country text,
    private boolean,
    hazardous boolean,
    starred boolean, -- Has the authenticated user starred this segment? (May vary per user)
    map jsonb, -- Contains 'id', 'polyline', 'resource_state' - sensitive location data
    total_elevation_gain numeric CHECK (total_elevation_gain IS NULL OR total_elevation_gain >= 0), -- meters
    effort_count integer CHECK (effort_count IS NULL OR effort_count >= 0), -- Total number of efforts on this segment
    athlete_count integer CHECK (athlete_count IS NULL OR athlete_count >= 0), -- Number of unique athletes who have attempted this segment
    star_count integer CHECK (star_count IS NULL OR star_count >= 0), -- Number of users who have starred this segment
    resource_state integer,
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When segment data should be purged/anonymized
    is_anonymized boolean DEFAULT false -- Flag to indicate if location data has been anonymized
);

COMMENT ON TABLE public.strava_segments IS 'Stores detailed information about Strava segments. Contains sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_segments.strava_id IS 'Strava''s unique identifier for the segment (Primary Key).';
COMMENT ON COLUMN public.strava_segments.climb_category IS 'Climb category: 0 (NC) to 5 (HC).';
COMMENT ON COLUMN public.strava_segments.start_latlng IS 'Starting GPS coordinates [lat, lng]. Sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_segments.end_latlng IS 'Ending GPS coordinates [lat, lng]. Sensitive location data under GDPR.';
COMMENT ON COLUMN public.strava_segments.map IS 'JSONB object containing map details like polyline. Contains sensitive location data.';
COMMENT ON COLUMN public.strava_segments.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this segment.';
COMMENT ON COLUMN public.strava_segments.data_retention_end_date IS 'Date after which segment data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_segments.is_anonymized IS 'Indicates whether location data has been anonymized for GDPR compliance.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_segments_activity_type ON public.strava_segments(activity_type);
CREATE INDEX IF NOT EXISTS idx_strava_segments_city ON public.strava_segments(city);
CREATE INDEX IF NOT EXISTS idx_strava_segments_state ON public.strava_segments(state);
CREATE INDEX IF NOT EXISTS idx_strava_segments_data_retention ON public.strava_segments(data_retention_end_date);


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
    elapsed_time integer NOT NULL CHECK (elapsed_time >= 0), -- seconds
    moving_time integer NOT NULL CHECK (moving_time >= 0), -- seconds
    start_date timestamp with time zone NOT NULL,
    start_date_local timestamp with time zone NOT NULL,
    distance numeric CHECK (distance IS NULL OR distance >= 0), -- meters (should match segment distance)
    start_index integer CHECK (start_index IS NULL OR start_index >= 0), -- Start index in the activity stream
    end_index integer CHECK (end_index IS NULL OR end_index >= 0), -- End index in the activity stream
    average_cadence numeric CHECK (average_cadence IS NULL OR average_cadence >= 0),
    average_watts numeric CHECK (average_watts IS NULL OR average_watts >= 0), -- Cycling power
    device_watts boolean,
    average_heartrate numeric CHECK (average_heartrate IS NULL OR average_heartrate >= 0),
    max_heartrate integer CHECK (max_heartrate IS NULL OR max_heartrate >= 0),
    kom_rank integer CHECK (kom_rank IS NULL OR (kom_rank >= 1 AND kom_rank <= 10)), -- King/Queen of the Mountain rank (1-10, null otherwise)
    pr_rank integer CHECK (pr_rank IS NULL OR (pr_rank >= 1 AND pr_rank <= 3)), -- Personal Record rank (1-3, null otherwise)
    achievements jsonb, -- Array of achievement details (e.g., KOM, CR, PR, rank)
    hidden boolean, -- Is this effort hidden by the athlete?
    resource_state integer,
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When effort data should be purged/anonymized
    is_anonymized boolean DEFAULT false, -- Flag to indicate if performance data has been anonymized

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

COMMENT ON TABLE public.strava_segment_efforts IS 'Stores details about athlete efforts on Strava segments within activities. Contains performance data protected under GDPR.';
COMMENT ON COLUMN public.strava_segment_efforts.strava_id IS 'Strava''s unique identifier for the segment effort (Primary Key).';
COMMENT ON COLUMN public.strava_segment_efforts.segment_id IS 'Foreign key referencing the Strava segment.';
COMMENT ON COLUMN public.strava_segment_efforts.activity_id IS 'Foreign key referencing the Strava activity during which the effort occurred.';
COMMENT ON COLUMN public.strava_segment_efforts.athlete_id IS 'Foreign key referencing the athlete who performed the effort.';
COMMENT ON COLUMN public.strava_segment_efforts.kom_rank IS 'King/Queen of the Mountain rank (1-10) for this effort, if applicable.';
COMMENT ON COLUMN public.strava_segment_efforts.pr_rank IS 'Personal Record rank (1-3) for this effort, if applicable.';
COMMENT ON COLUMN public.strava_segment_efforts.achievements IS 'JSONB array storing details about achievements earned on this effort.';
COMMENT ON COLUMN public.strava_segment_efforts.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this effort.';
COMMENT ON COLUMN public.strava_segment_efforts.average_heartrate IS 'Average heart rate during this segment effort. Health data under GDPR.';
COMMENT ON COLUMN public.strava_segment_efforts.max_heartrate IS 'Maximum heart rate during this segment effort. Health data under GDPR.';
COMMENT ON COLUMN public.strava_segment_efforts.data_retention_end_date IS 'Date after which effort data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_segment_efforts.is_anonymized IS 'Indicates whether performance data has been anonymized for GDPR compliance.';


-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_segment_id ON public.strava_segment_efforts(segment_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_activity_id ON public.strava_segment_efforts(activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_athlete_id ON public.strava_segment_efforts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_start_date ON public.strava_segment_efforts(start_date);
CREATE INDEX IF NOT EXISTS idx_strava_segment_efforts_data_retention ON public.strava_segment_efforts(data_retention_end_date);


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

-- Enable Row Level Security
ALTER TABLE public.strava_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_segment_efforts ENABLE ROW LEVEL SECURITY;

-- **CRITICAL: Service role bypass for both tables**
CREATE POLICY "Service role bypass"
ON public.strava_segments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass"
ON public.strava_segment_efforts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies for strava_segments
-- Public segments can be viewed by anyone
CREATE POLICY "Public segments can be viewed by anyone"
ON public.strava_segments
FOR SELECT
TO authenticated, anon
USING (private = false OR private IS NULL);

-- Private segments can only be viewed by the creator, those with access, or admins/researchers
CREATE POLICY "Private segments can only be viewed by authorized users"
ON public.strava_segments
FOR SELECT
TO authenticated
USING (
  private = false OR
  (private = true AND EXISTS (
    SELECT 1 FROM public.strava_segment_efforts
    WHERE segment_id = strava_segments.strava_id
    AND athlete_id IN (
      SELECT strava_id FROM public.strava_athletes
      WHERE strava_id IN (
        SELECT strava_athlete_id FROM public.users
        WHERE id = auth.uid()
      )
    )
  )) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);

-- Admins can modify segment data
CREATE POLICY "Admins can modify segment data"
ON public.strava_segments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for strava_segment_efforts
-- Athletes can view their own segment efforts, admins and researchers can view all
CREATE POLICY "Athletes can view their own segment efforts"
ON public.strava_segment_efforts
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

-- Admins can modify segment effort data
CREATE POLICY "Admins can modify segment effort data"
ON public.strava_segment_efforts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to anonymize segment location data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_segment_location_data(segment_id_param bigint)
RETURNS void AS $$
BEGIN
  -- Anonymize segment location data
  UPDATE public.strava_segments
  SET 
    start_latlng = NULL,
    end_latlng = NULL,
    map = jsonb_build_object('id', (map->>'id'), 'polyline', NULL, 'resource_state', 1),
    is_anonymized = true
  WHERE strava_id = segment_id_param;
  
  -- Log the anonymization
  INSERT INTO public.data_processing_logs (
    event_type, 
    description
  ) VALUES (
    'segment_location_data_anonymized', 
    format('Location data anonymized for segment %s', segment_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_segment_location_data IS 'Anonymizes segment location data for GDPR compliance.';

-- Function to anonymize segment effort performance data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_segment_effort_data(athlete_id_param bigint)
RETURNS void AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize segment effort performance data
  UPDATE public.strava_segment_efforts
  SET 
    elapsed_time = NULL,
    moving_time = NULL,
    average_cadence = NULL,
    average_watts = NULL,
    average_heartrate = NULL,
    max_heartrate = NULL,
    kom_rank = NULL,
    pr_rank = NULL,
    achievements = NULL,
    is_anonymized = true
  WHERE 
    athlete_id = athlete_id_param AND
    is_anonymized = false;
    
  GET DIAGNOSTICS v_processed = ROW_COUNT;
  
  -- Log the anonymization
  INSERT INTO public.data_processing_logs (
    event_type, 
    description,
    user_id
  ) VALUES (
    'segment_effort_data_anonymized', 
    format('Anonymized %s segment efforts for athlete %s', v_processed, athlete_id_param),
    (SELECT id FROM public.users WHERE strava_athlete_id = athlete_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_segment_effort_data IS 'Anonymizes segment effort performance data for GDPR compliance.';

-- Function to handle data retention for segments and efforts
CREATE OR REPLACE FUNCTION public.process_segment_data_retention()
RETURNS INTEGER AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize segment efforts that have reached their retention period
  UPDATE public.strava_segment_efforts
  SET 
    elapsed_time = NULL,
    moving_time = NULL,
    average_cadence = NULL,
    average_watts = NULL,
    average_heartrate = NULL,
    max_heartrate = NULL,
    kom_rank = NULL,
    pr_rank = NULL,
    achievements = NULL,
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
      'segment_effort_data_retention_processed', 
      format('Anonymized %s segment efforts that reached retention period', v_processed)
    );
  END IF;
  
  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_segment_data_retention IS 'Processes segment data that has reached its retention period by anonymizing it.';