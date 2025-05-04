-- frontend/docs/users.sql
-- Defines the table for application users, linking to Strava athlete profiles.

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Basic email format check
    strava_athlete_id bigint UNIQUE, -- Nullable if user hasn't connected Strava yet

    -- Foreign key constraint added after strava_athletes table is created
    -- CONSTRAINT fk_strava_athlete FOREIGN KEY (strava_athlete_id) REFERENCES public.strava_athletes(strava_id) ON DELETE SET NULL

    -- Add other application-specific user fields here (e.g., name, preferences)
    display_name character varying(255),
    app_preferences jsonb
);

COMMENT ON TABLE public.users IS 'Stores application-specific user accounts.';
COMMENT ON COLUMN public.users.id IS 'Unique identifier for the application user.';
COMMENT ON COLUMN public.users.email IS 'User''s email address, used for login.';
COMMENT ON COLUMN public.users.strava_athlete_id IS 'Foreign key linking to the corresponding Strava athlete profile.';
COMMENT ON COLUMN public.users.display_name IS 'User-chosen display name within the application.';
COMMENT ON COLUMN public.users.app_preferences IS 'Application-specific preferences stored as JSON.';

-- Optional: Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Optional: Index on strava_athlete_id for faster joins
CREATE INDEX IF NOT EXISTS idx_users_strava_athlete_id ON public.users(strava_athlete_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();