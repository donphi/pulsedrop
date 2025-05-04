-- Create the 'profiles' table
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    strava_athlete_id bigint UNIQUE,
    first_name text,
    last_name text,
    profile_picture_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Unique identifier for the profile record.';
COMMENT ON COLUMN public.profiles.user_id IS 'References the user in the auth.users table.';
COMMENT ON COLUMN public.profiles.strava_athlete_id IS 'Unique Strava athlete identifier.';
COMMENT ON COLUMN public.profiles.first_name IS 'User''s first name, potentially synced from Strava.';
COMMENT ON COLUMN public.profiles.last_name IS 'User''s last name, potentially synced from Strava.';
COMMENT ON COLUMN public.profiles.profile_picture_url IS 'URL to the user''s profile picture, potentially synced from Strava.';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp of when the profile was created.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of the last profile update.';

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant usage on the public schema if not already granted (often needed for RLS policies)
-- GRANT USAGE ON SCHEMA public TO authenticated; -- Uncomment if needed, depends on Supabase setup

-- Grant select permissions for authenticated users (RLS policies will restrict further)
-- GRANT SELECT ON TABLE public.profiles TO authenticated; -- Uncomment if needed

-- Create RLS policies
-- Policy: Allow users to select their own profile
CREATE POLICY "Allow individual select access"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow individual update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own profile
CREATE POLICY "Allow individual insert access"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: A DELETE policy is intentionally omitted as per requirements.
-- If deletion is needed later, a policy like the following could be added:
-- CREATE POLICY "Allow individual delete access"
-- ON public.profiles
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a trigger to call the function before update
CREATE TRIGGER on_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

