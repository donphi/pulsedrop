-- frontend/docs/strava_clubs.sql
-- Defines tables for Strava clubs and athlete membership.
-- GDPR Compliant: Contains social relationship data requiring protection

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
    member_count integer CHECK (member_count IS NULL OR member_count >= 0),
    featured boolean,
    verified boolean,
    url text, -- Club vanity URL on Strava
    membership text, -- Athlete's membership status: 'member', 'pending', 'null' (May vary per user)
    admin boolean, -- Is the authenticated athlete an admin? (May vary per user)
    owner boolean, -- Is the authenticated athlete the owner? (May vary per user)
    following_count integer CHECK (following_count IS NULL OR following_count >= 0), -- Number of members followed by the authenticated athlete (May vary per user)
    resource_state integer,
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When club data should be purged/anonymized
    is_anonymized boolean DEFAULT false -- Flag to indicate if social data has been anonymized
);

COMMENT ON TABLE public.strava_clubs IS 'Stores detailed information about Strava clubs. Contains social relationship data protected under GDPR.';
COMMENT ON COLUMN public.strava_clubs.strava_id IS 'Strava''s unique identifier for the club (Primary Key).';
COMMENT ON COLUMN public.strava_clubs.activity_types IS 'JSONB array listing the types of activities the club focuses on.';
COMMENT ON COLUMN public.strava_clubs.membership IS 'Authenticated athlete''s membership status in this club (member, pending, null). Varies per user. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_clubs.admin IS 'Indicates if the authenticated athlete is an admin of this club. Varies per user. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_clubs.owner IS 'Indicates if the authenticated athlete is the owner of this club. Varies per user. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_clubs.following_count IS 'Number of club members followed by the authenticated athlete. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_clubs.last_fetched_at IS 'Timestamp of the last successful data synchronization from the Strava API for this club.';
COMMENT ON COLUMN public.strava_clubs.data_retention_end_date IS 'Date after which club data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_clubs.is_anonymized IS 'Indicates whether social relationship data has been anonymized for GDPR compliance.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_clubs_sport_type ON public.strava_clubs(sport_type);
CREATE INDEX IF NOT EXISTS idx_strava_clubs_city ON public.strava_clubs(city);
CREATE INDEX IF NOT EXISTS idx_strava_clubs_state ON public.strava_clubs(state);
CREATE INDEX IF NOT EXISTS idx_strava_clubs_data_retention ON public.strava_clubs(data_retention_end_date);


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
    
    -- GDPR-related fields
    data_retention_end_date timestamp with time zone, -- When membership data should be purged/anonymized
    is_anonymized boolean DEFAULT false, -- Flag to indicate if membership data has been anonymized
    consent_to_process boolean DEFAULT false, -- Explicit consent to process social relationship data

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

COMMENT ON TABLE public.strava_athlete_clubs IS 'Junction table linking Strava athletes to the clubs they belong to, storing relationship-specific details. Contains social relationship data protected under GDPR.';
COMMENT ON COLUMN public.strava_athlete_clubs.athlete_id IS 'Foreign key referencing the Strava athlete.';
COMMENT ON COLUMN public.strava_athlete_clubs.club_id IS 'Foreign key referencing the Strava club.';
COMMENT ON COLUMN public.strava_athlete_clubs.membership IS 'Athlete''s membership status in this specific club. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_athlete_clubs.admin IS 'Indicates if the athlete is an admin of this specific club. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_athlete_clubs.owner IS 'Indicates if the athlete is the owner of this specific club. Social relationship data under GDPR.';
COMMENT ON COLUMN public.strava_athlete_clubs.data_retention_end_date IS 'Date after which membership data should be anonymized or deleted per GDPR requirements.';
COMMENT ON COLUMN public.strava_athlete_clubs.is_anonymized IS 'Indicates whether membership data has been anonymized for GDPR compliance.';
COMMENT ON COLUMN public.strava_athlete_clubs.consent_to_process IS 'Explicit consent from the athlete to process their club membership data.';


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

-- Enable Row Level Security
ALTER TABLE public.strava_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_athlete_clubs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for strava_clubs
-- Public clubs can be viewed by anyone
CREATE POLICY "Public clubs can be viewed by anyone"
ON public.strava_clubs
FOR SELECT
USING (private = false OR private IS NULL);

-- Private clubs can only be viewed by members, admins, or researchers
CREATE POLICY "Private clubs can only be viewed by members, admins, or researchers"
ON public.strava_clubs
FOR SELECT
USING (
  private = false OR
  (private = true AND EXISTS (
    SELECT 1 FROM public.strava_athlete_clubs
    WHERE club_id = strava_clubs.strava_id
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

-- Admins can modify club data
CREATE POLICY "Admins can modify club data"
ON public.strava_clubs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for strava_athlete_clubs
-- Athletes can view their own club memberships
CREATE POLICY "Athletes can view their own club memberships"
ON public.strava_athlete_clubs
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

-- Club admins can view all memberships for their clubs
CREATE POLICY "Club admins can view all memberships for their clubs"
ON public.strava_athlete_clubs
FOR SELECT
USING (
  club_id IN (
    SELECT club_id FROM public.strava_athlete_clubs
    WHERE admin = true AND athlete_id IN (
      SELECT strava_id FROM public.strava_athletes
      WHERE strava_id IN (
        SELECT strava_athlete_id FROM public.users
        WHERE id = auth.uid()
      )
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);

-- Admins can modify club membership data
CREATE POLICY "Admins can modify club membership data"
ON public.strava_athlete_clubs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to anonymize club social relationship data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_club_social_data(athlete_id_param bigint)
RETURNS void AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize athlete's club membership data
  UPDATE public.strava_athlete_clubs
  SET 
    membership = 'anonymized',
    admin = NULL,
    owner = NULL,
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
    'club_social_data_anonymized', 
    format('Anonymized %s club memberships for athlete %s', v_processed, athlete_id_param),
    (SELECT id FROM public.users WHERE strava_athlete_id = athlete_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_club_social_data IS 'Anonymizes club social relationship data for GDPR compliance.';

-- Function to handle data retention for club membership data
CREATE OR REPLACE FUNCTION public.process_club_data_retention()
RETURNS INTEGER AS $$
DECLARE
  v_processed INTEGER := 0;
BEGIN
  -- Anonymize club memberships that have reached their retention period
  UPDATE public.strava_athlete_clubs
  SET 
    membership = 'anonymized',
    admin = NULL,
    owner = NULL,
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
      'club_data_retention_processed', 
      format('Anonymized %s club memberships that reached retention period', v_processed)
    );
  END IF;
  
  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_club_data_retention IS 'Processes club membership data that has reached its retention period by anonymizing it.';

-- Create a view for club statistics without exposing sensitive social relationship data
CREATE OR REPLACE VIEW public.club_statistics AS
SELECT
  c.strava_id,
  c.name,
  c.sport_type,
  c.city,
  c.state,
  c.country,
  c.member_count,
  c.featured,
  c.verified,
  COUNT(ac.athlete_id) as confirmed_members
FROM
  public.strava_clubs c
LEFT JOIN
  public.strava_athlete_clubs ac ON c.strava_id = ac.club_id
WHERE
  c.private = false AND
  ac.is_anonymized = false
GROUP BY
  c.strava_id;

COMMENT ON VIEW public.club_statistics IS 'Provides club statistics without exposing sensitive social relationship data.';

-- Enable RLS on the view and allow researchers and admins to access it
ALTER VIEW public.club_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Researchers and admins can access club statistics"
ON public.club_statistics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'researcher')
  )
);