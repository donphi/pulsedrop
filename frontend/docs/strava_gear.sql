-- frontend/docs/strava_gear.sql
-- Defines the table for storing information about an athlete's gear (bikes, shoes).
-- GDPR Compliant: Contains less sensitive data but still requires protection

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
    distance numeric DEFAULT 0 CHECK (distance >= 0), -- Total distance recorded with this gear in meters
    converted_distance numeric CHECK (converted_distance IS NULL OR converted_distance >= 0), -- Distance in user's preferred units (consider calculating on read instead?)
    brand_name text,
    model_name text,
    frame_type text, -- Specific to bikes (e.g., road, mountain, tt)
    description text,
    resource_state integer, -- Strava's resource state (e.g., 2 for summary, 3 for detailed)
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When gear data should be purged/anonymized
    is_anonymized boolean DEFAULT false, -- Flag to indicate if gear data has been anonymized

    -- Foreign Key Constraint
    CONSTRAINT fk_athlete
        FOREIGN KEY(athlete_id)
        REFERENCES public.strava_athletes(strava_id)
        ON DELETE CASCADE -- If the athlete is deleted, remove their gear too
);

COMMENT ON TABLE public.strava_gear IS 'Stores details about Strava athletes'' gear (bikes and shoes). Contains personal preference data protected under GDPR.';
COMMENT ON COLUMN public.strava_gear.strava_id IS 'Strava''s unique identifier for the gear item (Primary Key). Can be alphanumeric.';
COMMENT ON COLUMN public.strava_gear.athlete_id IS 'Foreign key referencing the athlete who owns this gear.';
COMMENT ON COLUMN public.strava_gear.primary_gear IS 'Whether this gear is marked as primary by the athlete.';
COMMENT ON COLUMN public.strava_gear.distance IS 'Total distance recorded with this gear, in meters.';
COMMENT ON COLUMN public.strava_gear.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this gear item.';
COMMENT ON COLUMN public.strava_gear.data_retention_end_date IS 'Date after which gear data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_gear.is_anonymized IS 'Indicates whether gear data has been anonymized for GDPR compliance.';

-- Index on athlete_id for efficient lookup of gear per athlete
CREATE INDEX IF NOT EXISTS idx_strava_gear_athlete_id ON public.strava_gear(athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_gear_data_retention ON public.strava_gear(data_retention_end_date);

-- Trigger to update updated_at timestamp
-- Assumes the function handle_updated_at exists (created in users.sql)
DROP TRIGGER IF EXISTS on_strava_gear_updated ON public.strava_gear;
CREATE TRIGGER on_strava_gear_updated
BEFORE UPDATE ON public.strava_gear
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.strava_gear ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Athletes can view their own gear, admins and researchers can view all gear
CREATE POLICY "Athletes can view their own gear"
ON public.strava_gear
FOR SELECT
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

-- Athletes can update their own gear, admins can update all gear
CREATE POLICY "Athletes can update their own gear"
ON public.strava_gear
FOR UPDATE
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

-- Only admins can delete gear
CREATE POLICY "Only admins can delete gear"
ON public.strava_gear
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to anonymize gear data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_gear_data(athlete_id_param bigint)
RETURNS void AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize gear data
  UPDATE public.strava_gear
  SET 
    name = 'Anonymized Gear',
    nickname = NULL,
    brand_name = NULL,
    model_name = NULL,
    frame_type = NULL,
    description = NULL,
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
    'gear_data_anonymized', 
    format('Anonymized %s gear items for athlete %s', v_processed, athlete_id_param),
    (SELECT id FROM public.users WHERE strava_athlete_id = athlete_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_gear_data IS 'Anonymizes gear data for GDPR compliance.';

-- Function to handle data retention for gear data
CREATE OR REPLACE FUNCTION public.process_gear_data_retention()
RETURNS INTEGER AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize gear data that has reached its retention period
  UPDATE public.strava_gear
  SET 
    name = 'Anonymized Gear',
    nickname = NULL,
    brand_name = NULL,
    model_name = NULL,
    frame_type = NULL,
    description = NULL,
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
      'gear_data_retention_processed', 
      format('Anonymized %s gear items that reached retention period', v_processed)
    );
  END IF;
  
  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_gear_data_retention IS 'Processes gear data that has reached its retention period by anonymizing it.';

-- Create a view for gear statistics without exposing personal details
CREATE OR REPLACE VIEW public.gear_statistics AS
SELECT
  brand_name,
  model_name,
  frame_type,
  COUNT(*) as usage_count,
  AVG(distance) as avg_distance,
  SUM(CASE WHEN primary_gear THEN 1 ELSE 0 END) as primary_count,
  SUM(CASE WHEN retired THEN 1 ELSE 0 END) as retired_count
FROM
  public.strava_gear
WHERE
  is_anonymized = false
GROUP BY
  brand_name, model_name, frame_type;

COMMENT ON VIEW public.gear_statistics IS 'Provides aggregated gear statistics without exposing personal details.';

-- Enable RLS on the view and allow researchers and admins to access it
ALTER VIEW public.gear_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Researchers and admins can access gear statistics"
ON public.gear_statistics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);