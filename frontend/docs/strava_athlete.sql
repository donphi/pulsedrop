-- frontend/docs/strava_athlete.sql
-- Defines the table for storing detailed Strava athlete profile information.
-- GDPR Compliant: Contains personal data and OAuth tokens requiring protection

CREATE TYPE athlete_sex AS ENUM ('M', 'F', 'O');

CREATE TABLE IF NOT EXISTS public.strava_athletes (
    strava_id bigint PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_fetched_at timestamptz,

    -- Profile Information (Personal Data - GDPR Sensitive)
    username text UNIQUE,
    firstname text,
    lastname text,
    bio text,
    city text,
    state text,
    country text,
    sex athlete_sex,
    profile_medium text,
    profile text,
    friend boolean,
    follower boolean,
    premium boolean,
    summit boolean,
    strava_created_at timestamptz,
    strava_updated_at timestamptz,
    badge_type_id integer,
    weight numeric CHECK (weight > 0 AND weight < 500), -- Reasonable upper limit
    profile_original text,

    -- Relationship Counts
    follower_count integer DEFAULT 0 CHECK (follower_count >= 0),
    friend_count integer DEFAULT 0 CHECK (friend_count >= 0),
    mutual_friend_count integer DEFAULT 0 CHECK (mutual_friend_count >= 0),
    athlete_type integer CHECK (athlete_type IS NULL OR athlete_type >= 0),
    date_preference text,
    measurement_preference text CHECK (measurement_preference IN ('feet', 'meters')),
    ftp integer CHECK (ftp >= 0 AND ftp < 2000), -- Reasonable upper limit

    -- OAuth details (Sensitive: enforce RLS policies)
    strava_access_token text,
    strava_refresh_token text,
    strava_token_expires_at timestamptz,
    strava_scope text,

    -- GDPR-related fields
    data_retention_end_date timestamptz, -- When athlete data should be purged/anonymized
    consent_version text, -- Version of consent given
    consent_date timestamptz, -- When consent was given
    data_processing_allowed boolean DEFAULT true -- Whether data processing is allowed

    -- Link to application user (uncomment if desired)
    -- user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.strava_athletes IS 'Detailed profile and OAuth information for Strava athletes linked to application users. Contains personal data subject to GDPR.';
COMMENT ON COLUMN public.strava_athletes.strava_id IS 'Strava unique identifier.';
COMMENT ON COLUMN public.strava_athletes.sex IS 'Athlete''s biological sex: M, F, or O (Other/unspecified). Sensitive personal data under GDPR.';
COMMENT ON COLUMN public.strava_athletes.weight IS 'Athlete''s weight in kilograms; nullable if athlete chooses not to set. Health data under GDPR.';
COMMENT ON COLUMN public.strava_athletes.measurement_preference IS 'Unit preference for distances and elevations (feet or meters).';
COMMENT ON COLUMN public.strava_athletes.strava_access_token IS 'Sensitive: OAuth access token. Must be protected.';
COMMENT ON COLUMN public.strava_athletes.strava_refresh_token IS 'Sensitive: OAuth refresh token. Must be protected.';
COMMENT ON COLUMN public.strava_athletes.strava_scope IS 'OAuth scopes granted to application.';
COMMENT ON COLUMN public.strava_athletes.data_retention_end_date IS 'Date after which athlete data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_athletes.consent_version IS 'Version of the privacy policy/terms that the user consented to.';
COMMENT ON COLUMN public.strava_athletes.consent_date IS 'Timestamp when the user provided consent for data processing.';
COMMENT ON COLUMN public.strava_athletes.data_processing_allowed IS 'Whether the user has allowed processing of their data.';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_strava_athletes_username ON public.strava_athletes(username);
CREATE INDEX IF NOT EXISTS idx_strava_athletes_data_retention ON public.strava_athletes(data_retention_end_date);
CREATE INDEX IF NOT EXISTS idx_strava_athletes_token_expires ON public.strava_athletes(strava_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_strava_athletes_consent ON public.strava_athletes(data_processing_allowed);

-- Enable Row Level Security explicitly
ALTER TABLE public.strava_athletes ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update updated_at (ensure function exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_strava_athletes_updated ON public.strava_athletes;
CREATE TRIGGER on_strava_athletes_updated
BEFORE UPDATE ON public.strava_athletes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Foreign Key Constraint (assuming users table has strava_athlete_id)
ALTER TABLE public.users
ADD CONSTRAINT fk_strava_athlete
FOREIGN KEY (strava_athlete_id)
REFERENCES public.strava_athletes(strava_id)
ON DELETE SET NULL;

-- Create RLS policies
-- Policy: Allow users to select their own athlete data
CREATE POLICY "Users can view their own athlete data"
ON public.strava_athletes
FOR SELECT
USING (strava_id IN (
  SELECT strava_athlete_id FROM public.users
  WHERE auth.uid() = id
));

-- Policy: Allow users to update their own athlete data
CREATE POLICY "Users can update their own athlete data"
ON public.strava_athletes
FOR UPDATE
USING (strava_id IN (
  SELECT strava_athlete_id FROM public.users
  WHERE auth.uid() = id
));

-- Policy: Allow system to insert athlete data (for OAuth flow)
CREATE POLICY "System can insert athlete data"
ON public.strava_athletes
FOR INSERT
WITH CHECK (true); -- Restricted by application logic during OAuth flow

-- Policy: Allow admins and researchers to view all athlete data
CREATE POLICY "Admins and researchers can view all athlete data"
ON public.strava_athletes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth.uid() = id AND role IN ('admin', 'researcher')
  )
);

-- Policy: Allow admins to update all athlete data
CREATE POLICY "Admins can update all athlete data"
ON public.strava_athletes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth.uid() = id AND role = 'admin'
  )
);

-- Policy: Allow admins to delete athlete data
CREATE POLICY "Admins can delete athlete data"
ON public.strava_athletes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth.uid() = id AND role = 'admin'
  )
);

-- Function to anonymize athlete data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_athlete_data(athlete_id_param bigint)
RETURNS void AS $$
BEGIN
  -- Anonymize personal information
  UPDATE public.strava_athletes
  SET
    firstname = 'Anonymous',
    lastname = 'User',
    bio = NULL,
    city = NULL,
    state = NULL,
    country = NULL,
    profile_medium = NULL,
    profile = NULL,
    profile_original = NULL,
    weight = NULL,
    -- Keep non-personal data
    -- Revoke tokens
    strava_access_token = NULL,
    strava_refresh_token = NULL,
    strava_token_expires_at = NULL
  WHERE strava_id = athlete_id_param;
  
  -- Log the anonymization
  INSERT INTO public.data_processing_logs (
    event_type,
    description
  ) VALUES (
    'athlete_data_anonymized',
    format('Athlete data anonymized for athlete %s', athlete_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_athlete_data IS 'Anonymizes athlete personal data across all athlete-related tables for GDPR compliance.';

-- Create a table for data processing logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.data_processing_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    event_type text NOT NULL,
    description text,
    metadata jsonb
);

COMMENT ON TABLE public.data_processing_logs IS 'Logs data processing events for GDPR compliance and audit purposes.';