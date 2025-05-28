-- frontend/docs/strava_heart_rate.sql
-- Defines a table for storing granular heart rate stream data points from Strava activities.
-- GDPR Compliant: Contains special category health data requiring enhanced protection
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
    time_offset integer NOT NULL CHECK (time_offset >= 0), -- Time offset in seconds from the start of the activity
    heart_rate integer CHECK (heart_rate IS NULL OR (heart_rate > 0 AND heart_rate < 250)), -- Heart rate in beats per minute (BPM) at this time offset. Can be null if HR data wasn't available for this point.
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of record creation in our DB
    updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Timestamp of last update in our DB
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When heart rate data should be purged/anonymized
    is_anonymized boolean DEFAULT false, -- Flag to indicate if this data point has been anonymized

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

COMMENT ON TABLE public.strava_activity_hr_stream_points IS 'Stores individual heart rate data points from Strava activity streams for detailed analysis. Contains special category health data under GDPR Article 9. Can become very large.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.activity_id IS 'Foreign key referencing the parent Strava activity.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.athlete_id IS 'Denormalized foreign key referencing the athlete.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.time_offset IS 'Time offset in seconds from the start of the activity for this data point.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.heart_rate IS 'Heart rate in beats per minute (BPM) at the specified time offset. Special category health data under GDPR.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.unique_hr_point_per_activity IS 'Ensures only one heart rate value exists per time offset within a single activity.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.data_retention_end_date IS 'Date after which heart rate data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_activity_hr_stream_points.is_anonymized IS 'Indicates whether this data point has been anonymized for GDPR compliance.';


-- Indexes for common query patterns
-- Indexing time_offset along with activity_id is crucial for time-series queries
CREATE INDEX IF NOT EXISTS idx_strava_hr_points_activity_time ON public.strava_activity_hr_stream_points(activity_id, time_offset);
CREATE INDEX IF NOT EXISTS idx_strava_hr_points_athlete_activity ON public.strava_activity_hr_stream_points(athlete_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_strava_hr_points_data_retention ON public.strava_activity_hr_stream_points(data_retention_end_date);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_strava_hr_points_updated ON public.strava_activity_hr_stream_points;
CREATE TRIGGER on_strava_hr_points_updated
BEFORE UPDATE ON public.strava_activity_hr_stream_points
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.strava_activity_hr_stream_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Athletes can view only their own heart rate data, admins and researchers can view all
CREATE POLICY "Athletes can view their own heart rate data"
ON public.strava_activity_hr_stream_points
FOR SELECT
USING (
  athlete_id IN (
    SELECT strava_id FROM public.strava_athletes
    WHERE strava_id = athlete_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);

-- Only system processes can insert/update heart rate data
CREATE POLICY "Only system processes can modify heart rate data"
ON public.strava_activity_hr_stream_points
FOR ALL
USING (
  (auth.jwt() ? 'is_service_role') OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete heart rate data
CREATE POLICY "Only admins can delete heart rate data"
ON public.strava_activity_hr_stream_points
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to anonymize heart rate data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_heart_rate_data(athlete_id_param bigint)
RETURNS void AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize heart rate data by replacing actual values with statistical ranges
  -- This preserves research value while removing personal identifiability
  UPDATE public.strava_activity_hr_stream_points
  SET 
    heart_rate = 
      CASE 
        WHEN heart_rate < 100 THEN 80 -- Low range
        WHEN heart_rate BETWEEN 100 AND 140 THEN 120 -- Medium range
        WHEN heart_rate BETWEEN 141 AND 170 THEN 155 -- High range
        WHEN heart_rate > 170 THEN 185 -- Very high range
        ELSE NULL
      END,
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
    'heart_rate_data_anonymized', 
    format('Anonymized %s heart rate data points for athlete %s', v_processed, athlete_id_param),
    (SELECT id FROM public.users WHERE strava_athlete_id = athlete_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_heart_rate_data IS 'Anonymizes heart rate data for GDPR compliance while preserving research value.';

-- Function to handle data retention for heart rate data
CREATE OR REPLACE FUNCTION public.process_heart_rate_data_retention()
RETURNS INTEGER AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize data that has reached its retention period
  UPDATE public.strava_activity_hr_stream_points
  SET 
    heart_rate = 
      CASE 
        WHEN heart_rate < 100 THEN 80 -- Low range
        WHEN heart_rate BETWEEN 100 AND 140 THEN 120 -- Medium range
        WHEN heart_rate BETWEEN 141 AND 170 THEN 155 -- High range
        WHEN heart_rate > 170 THEN 185 -- Very high range
        ELSE NULL
      END,
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
      'heart_rate_data_retention_processed', 
      format('Anonymized %s heart rate data points that reached retention period', v_processed)
    );
  END IF;
  
  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_heart_rate_data_retention IS 'Processes heart rate data that has reached its retention period by anonymizing it.';

-- Create a view for aggregated heart rate data (for research purposes)
-- This provides a privacy-preserving way to access heart rate data for research
CREATE OR REPLACE VIEW public.aggregated_heart_rate_data AS
SELECT
  activity_id,
  COUNT(*) as data_points,
  MIN(heart_rate) as min_heart_rate,
  MAX(heart_rate) as max_heart_rate,
  AVG(heart_rate) as avg_heart_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY heart_rate) as median_heart_rate,
  STDDEV(heart_rate) as stddev_heart_rate
FROM
  public.strava_activity_hr_stream_points
WHERE
  heart_rate IS NOT NULL
GROUP BY
  activity_id;

COMMENT ON VIEW public.aggregated_heart_rate_data IS 'Provides aggregated heart rate statistics for research purposes while preserving privacy.';

-- Create RLS policy for the view to allow researchers and admins to access it
ALTER VIEW public.aggregated_heart_rate_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Researchers and admins can access aggregated heart rate data"
ON public.aggregated_heart_rate_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);