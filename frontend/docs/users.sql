-- frontend/docs/users.sql
-- Defines the table for application users, linking to Strava athlete profiles.
-- GDPR Compliant: Contains personal data requiring Row Level Security

-- COMPLETE DATABASE CLEANUP - Remove ALL existing tables and types
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.strava_activity_hr_stream_points CASCADE;
DROP TABLE IF EXISTS public.strava_segment_efforts CASCADE;
DROP TABLE IF EXISTS public.strava_segments CASCADE;
DROP TABLE IF EXISTS public.strava_routes CASCADE;
DROP TABLE IF EXISTS public.strava_activity_photos CASCADE;
DROP TABLE IF EXISTS public.strava_activity_streams CASCADE;
DROP TABLE IF EXISTS public.strava_activity_laps CASCADE;
DROP TABLE IF EXISTS public.strava_activities CASCADE;
DROP TABLE IF EXISTS public.strava_athlete_clubs CASCADE;
DROP TABLE IF EXISTS public.strava_clubs CASCADE;
DROP TABLE IF EXISTS public.strava_gear CASCADE;
DROP TABLE IF EXISTS public.strava_athletes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.data_processing_logs CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS athlete_sex CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create user role type
CREATE TYPE user_role AS ENUM ('user', 'researcher', 'admin');

CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    -- Make email nullable but keep format validation when present
    email text UNIQUE CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    strava_athlete_id bigint UNIQUE, -- Nullable if user hasn't connected Strava yet
    
    -- Add other application-specific user fields here
    display_name character varying(255),
    first_name text,
    last_name text,
    profile_picture_url text,
    app_preferences jsonb,
    
    -- User role for access control
    role user_role NOT NULL DEFAULT 'user',
    
    -- GDPR-related fields
    consent_version text,
    consent_timestamp timestamp with time zone,
    data_retention_end_date timestamp with time zone,
    
    -- Data validation constraints (keeping your strictness)
    CONSTRAINT valid_display_name CHECK (display_name IS NULL OR length(display_name) >= 2),
    -- Ensure either email OR strava_athlete_id exists (user must have some identifier)
    CONSTRAINT must_have_identifier CHECK (email IS NOT NULL OR strava_athlete_id IS NOT NULL)
);

-- Comments
COMMENT ON TABLE public.users IS 'Stores application-specific user accounts with GDPR compliance.';
COMMENT ON COLUMN public.users.id IS 'Unique identifier for the application user.';
COMMENT ON COLUMN public.users.email IS 'User''s email address (optional for Strava-only users). Personal data under GDPR.';
COMMENT ON COLUMN public.users.strava_athlete_id IS 'Foreign key linking to the corresponding Strava athlete profile.';
COMMENT ON COLUMN public.users.display_name IS 'User-chosen display name within the application. Personal data under GDPR.';
COMMENT ON COLUMN public.users.first_name IS 'User''s first name, potentially synced from Strava. Personal data under GDPR.';
COMMENT ON COLUMN public.users.last_name IS 'User''s last name, potentially synced from Strava. Personal data under GDPR.';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL to user''s profile picture, potentially synced from Strava.';
COMMENT ON COLUMN public.users.app_preferences IS 'Application-specific preferences stored as JSON.';
COMMENT ON COLUMN public.users.role IS 'User role for access control: user (regular user), researcher (can view data for research), admin (full access).';

-- Indexes for common query patterns
CREATE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_strava_athlete_id ON public.users(strava_athlete_id) WHERE strava_athlete_id IS NOT NULL;
CREATE INDEX idx_users_data_retention ON public.users(data_retention_end_date);
CREATE INDEX idx_users_role ON public.users(role);

-- Trigger function and trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_users_updated
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- CORRECTED RLS POLICIES FOR NEXTAUTH

-- 1. Service role bypass (for NextAuth operations)
CREATE POLICY "Service role bypass"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Allow authenticated users to view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow system operations for user creation (NextAuth sign-in flow)
CREATE POLICY "Allow user creation"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 5. Admin access policies
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);

CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Helper function
CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR deletion function
CREATE OR REPLACE FUNCTION public.handle_user_deletion_request(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET 
    email = 'anonymized_' || encode(digest(id::text, 'sha256'), 'hex') || '@anonymized.com',
    display_name = 'Anonymized User',
    first_name = NULL,
    last_name = NULL,
    profile_picture_url = NULL,
    app_preferences = NULL,
    strava_athlete_id = NULL
  WHERE id = user_uuid;
  
  INSERT INTO public.data_processing_logs (
    event_type, 
    user_id, 
    description
  ) VALUES (
    'user_anonymized', 
    user_uuid, 
    'User data anonymized per GDPR request'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create data processing logs table
CREATE TABLE public.data_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  description text,
  ip_address text,
  admin_id uuid
);

COMMENT ON TABLE public.data_processing_logs IS 'Logs data processing activities for GDPR compliance and audit trails.';

-- Enable RLS on logs
ALTER TABLE public.data_processing_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role and admins to access logs
CREATE POLICY "Service role and admins can access logs"
ON public.data_processing_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can access logs"
ON public.data_processing_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'researcher'))
);