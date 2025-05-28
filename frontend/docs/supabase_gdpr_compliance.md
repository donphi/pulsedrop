# Supabase GDPR Compliance: Database Security Implementation Guide

## Table of Contents

- [Supabase GDPR Compliance: Database Security Implementation Guide](#supabase-gdpr-compliance-database-security-implementation-guide)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [GDPR Overview for Research Applications](#gdpr-overview-for-research-applications)
    - [Key GDPR Principles for Research](#key-gdpr-principles-for-research)
    - [Special Considerations for Health/Fitness Data](#special-considerations-for-healthfitness-data)
    - [Lawful Basis for Processing in Research](#lawful-basis-for-processing-in-research)
    - [Data Subject Rights in Research Settings](#data-subject-rights-in-research-settings)
  - [Supabase GDPR Configuration Checklist](#supabase-gdpr-configuration-checklist)
    - [Database-level Settings](#database-level-settings)
      - [1. Enabling Row Level Security (RLS)](#1-enabling-row-level-security-rls)
      - [2. Setting Up Proper Authentication Flows](#2-setting-up-proper-authentication-flows)
      - [3. Configuring Secure API Access](#3-configuring-secure-api-access)
    - [Data Encryption Strategies](#data-encryption-strategies)
      - [1. Implementing pgcrypto for OAuth Token Encryption](#1-implementing-pgcrypto-for-oauth-token-encryption)
      - [2. Column-level Encryption for Sensitive Fields](#2-column-level-encryption-for-sensitive-fields)
      - [3. Key Management Recommendations](#3-key-management-recommendations)
    - [User Consent Management](#user-consent-management)
      - [1. Consent Collection Workflow](#1-consent-collection-workflow)
      - [2. Storing Consent Records](#2-storing-consent-records)
      - [3. Consent Withdrawal Mechanisms](#3-consent-withdrawal-mechanisms)
    - [Data Retention Policies](#data-retention-policies)
      - [1. Research Data Retention Timeframes](#1-research-data-retention-timeframes)
      - [2. Automated Data Purging Mechanisms](#2-automated-data-purging-mechanisms)
      - [3. Data Anonymization Strategies](#3-data-anonymization-strategies)
    - [Data Subject Rights Implementation](#data-subject-rights-implementation)
      - [1. Access Request Handling](#1-access-request-handling)
      - [2. Data Portability Implementation](#2-data-portability-implementation)
      - [3. Right to Erasure Mechanisms](#3-right-to-erasure-mechanisms)
      - [4. Data Rectification Processes](#4-data-rectification-processes)
  - [Table-Specific Recommendations](#table-specific-recommendations)
    - [User/Profile Tables](#userprofile-tables)
      - [Personal Data Fields Identification](#personal-data-fields-identification)
      - [RLS Policies](#rls-policies)
      - [Encryption Needs](#encryption-needs)
      - [Data Minimization Strategies](#data-minimization-strategies)
    - [Strava Athlete Tables](#strava-athlete-tables)
      - [OAuth Token Encryption](#oauth-token-encryption)
      - [Personal Data Protection](#personal-data-protection)
    - [Activity Data Tables](#activity-data-tables)
      - [Location Data Handling](#location-data-handling)
      - [Biometric Data Protection](#biometric-data-protection)
    - [Heart Rate/Biometric Tables](#heart-ratebiometric-tables)
      - [Special Category Data Protection](#special-category-data-protection)
      - [Anonymization Options](#anonymization-options)
  - [Implementation Priority](#implementation-priority)
    - [Critical Security Issues (Immediate Action)](#critical-security-issues-immediate-action)
    - [High-Priority Data Protection Measures (1-2 Weeks)](#high-priority-data-protection-measures-1-2-weeks)
    - [Medium-Priority Compliance Features (2-4 Weeks)](#medium-priority-compliance-features-2-4-weeks)
    - [Long-term Compliance Roadmap (Ongoing)](#long-term-compliance-roadmap-ongoing)
  - [Ongoing Compliance Monitoring](#ongoing-compliance-monitoring)
    - [Regular Audit Procedures](#regular-audit-procedures)
    - [Compliance Testing Methodologies](#compliance-testing-methodologies)
    - [Documentation Requirements](#documentation-requirements)
    - [Incident Response Planning](#incident-response-planning)
  - [Privacy Policy \& Terms Template](#privacy-policy--terms-template)
    - [Research-Specific Privacy Policy Sections](#research-specific-privacy-policy-sections)
    - [Data Processing Disclosures](#data-processing-disclosures)
    - [User Rights Explanations](#user-rights-explanations)
    - [Consent Management Details](#consent-management-details)

## Introduction

This document provides comprehensive guidance for implementing GDPR compliance in our Supabase database infrastructure, with a specific focus on securing sensitive data for our PhD research project on high exercise. 

The General Data Protection Regulation (GDPR) imposes strict requirements on how we collect, process, store, and protect personal data. For research applications like ours that collect fitness and health data through Strava integration, compliance is particularly important as we're handling both personal data and special category data (biometric information).

Based on our SQL schema review, we've identified several areas requiring immediate attention:
1. **Row Level Security (RLS)**: Most tables lack proper RLS policies
2. **Data Validation**: Many tables need additional CHECK constraints
3. **Sensitive Data Handling**: OAuth tokens and personal information require encryption
4. **Documentation**: Consistent and detailed comments are needed across all database objects

This guide provides actionable recommendations to address these issues and establish a GDPR-compliant database infrastructure.

## GDPR Overview for Research Applications

### Key GDPR Principles for Research

1. **Lawfulness, Fairness, and Transparency**: Research data processing requires a valid legal basis, typically consent or legitimate interest.

2. **Purpose Limitation**: Data collected for research must be used only for specified, explicit, and legitimate purposes.

3. **Data Minimization**: Only collect data necessary for the research objectives.

4. **Accuracy**: Ensure data is accurate and kept up to date.

5. **Storage Limitation**: Store identifiable data only for as long as necessary.

6. **Integrity and Confidentiality**: Implement appropriate security measures.

7. **Accountability**: Demonstrate compliance through documentation.

### Special Considerations for Health/Fitness Data

Health and fitness data, including heart rate measurements, are considered "special category data" under GDPR Article 9, requiring:

- **Explicit Consent**: Clear, specific consent for processing biometric data
- **Enhanced Security Measures**: Stronger protection than regular personal data
- **Data Protection Impact Assessment (DPIA)**: Required before processing
- **Research Exemptions**: While some exemptions exist for scientific research, core data protection principles still apply

### Lawful Basis for Processing in Research

For our PhD project, we rely on:

1. **Explicit Consent** (Article 6(1)(a) and 9(2)(a)): Primary basis for collecting and processing fitness data
2. **Legitimate Interest** (Article 6(1)(f)): May apply for certain analytical processing
3. **Research Purposes** (Article 9(2)(j)): Special provisions for scientific research

### Data Subject Rights in Research Settings

Research participants retain their rights to:

- Access their data
- Request rectification of inaccurate data
- Withdraw consent and request erasure
- Data portability
- Object to processing

While some derogations exist for research, we should implement technical measures to honor these rights whenever possible.
## Supabase GDPR Configuration Checklist

### Database-level Settings

#### 1. Enabling Row Level Security (RLS)

RLS is critical for ensuring users can only access their own data. For each table containing personal data:

```sql
-- Enable RLS on the table
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own data
CREATE POLICY "Users can view their own data"
ON public.table_name
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to update only their own data
CREATE POLICY "Users can update their own data"
ON public.table_name
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to delete only their own data
CREATE POLICY "Users can delete their own data"
ON public.table_name
FOR DELETE
USING (auth.uid() = user_id);
```

#### 2. Setting Up Proper Authentication Flows

Configure Supabase Auth to:

- Require email verification
- Implement strong password policies
- Set appropriate session timeouts
- Configure secure OAuth settings for Strava integration

```sql
-- Example: Create a secure auth trigger that logs authentication events
CREATE OR REPLACE FUNCTION public.handle_auth_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auth_audit_logs (user_id, event_type, ip_address, timestamp)
  VALUES (NEW.id, TG_OP, current_setting('request.headers')::json->>'x-forwarded-for', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_audit_log();
```

#### 3. Configuring Secure API Access

- Use Supabase's Row Level Security to restrict API access
- Implement proper JWT validation
- Set up API rate limiting to prevent abuse

### Data Encryption Strategies

#### 1. Implementing pgcrypto for OAuth Token Encryption

First, enable the pgcrypto extension if not already enabled:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Create encryption and decryption functions:

```sql
-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_value(value TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      value,
      key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_value(encrypted_value TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_value, 'base64'),
    key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL; -- Handle decryption errors gracefully
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Modify the strava_athletes table to use encrypted tokens:

```sql
-- Add encrypted token columns
ALTER TABLE public.strava_athletes 
ADD COLUMN encrypted_access_token TEXT,
ADD COLUMN encrypted_refresh_token TEXT;

-- Create a migration function to encrypt existing tokens
CREATE OR REPLACE FUNCTION migrate_encrypt_tokens(encryption_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.strava_athletes
  SET 
    encrypted_access_token = encrypt_value(strava_access_token, encryption_key),
    encrypted_refresh_token = encrypt_value(strava_refresh_token, encryption_key),
    strava_access_token = NULL,
    strava_refresh_token = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Column-level Encryption for Sensitive Fields

Identify and encrypt other sensitive fields:

```sql
-- Example: Encrypt personal health information
ALTER TABLE public.user_health_data
ADD COLUMN encrypted_health_notes TEXT;

UPDATE public.user_health_data
SET 
  encrypted_health_notes = encrypt_value(health_notes, current_setting('app.settings.encryption_key')),
  health_notes = NULL;
```

#### 3. Key Management Recommendations

- Store encryption keys in environment variables, never in the database
- Implement key rotation procedures
- Use Supabase's Vault feature (when available) for key management
- Consider a dedicated key management service for production

```typescript
// Example key management in Next.js API route
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  // Use environment variable for encryption key
  const encryptionKey = process.env.DATA_ENCRYPTION_KEY
  
  // Execute with encryption key
  const { data, error } = await supabase.rpc('encrypt_sensitive_data', {
    encryption_key: encryptionKey
  })
  
  // Response handling
}
```

### User Consent Management

#### 1. Consent Collection Workflow

Implement a dedicated consent table:

```sql
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  withdrawn_at TIMESTAMPTZ,
  
  -- Enforce uniqueness of active consents per user and type
  CONSTRAINT unique_active_consent UNIQUE (user_id, consent_type, is_active)
    DEFERRABLE INITIALLY DEFERRED,
  
  -- Validate consent types
  CONSTRAINT valid_consent_type CHECK (consent_type IN (
    'research_participation', 
    'data_collection',
    'biometric_processing',
    'location_tracking',
    'data_sharing'
  ))
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own consents"
ON public.user_consents
FOR SELECT
USING (auth.uid() = user_id);
```

#### 2. Storing Consent Records

Create functions to manage consent:

```sql
-- Function to record new consent
CREATE OR REPLACE FUNCTION public.record_user_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_consent_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  -- Deactivate any existing active consent of this type
  UPDATE public.user_consents
  SET 
    is_active = false,
    withdrawn_at = now()
  WHERE 
    user_id = p_user_id AND 
    consent_type = p_consent_type AND
    is_active = true;
    
  -- Insert new consent record
  INSERT INTO public.user_consents (
    user_id, 
    consent_type, 
    consent_version, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id,
    p_consent_type,
    p_consent_version,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_consent_id;
  
  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Consent Withdrawal Mechanisms

```sql
-- Function to withdraw consent
CREATE OR REPLACE FUNCTION public.withdraw_user_consent(
  p_user_id UUID,
  p_consent_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE public.user_consents
  SET 
    is_active = false,
    withdrawn_at = now()
  WHERE 
    user_id = p_user_id AND 
    consent_type = p_consent_type AND
    is_active = true;
    
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN v_rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Data Retention Policies

#### 1. Research Data Retention Timeframes

Create a table to manage retention policies:

```sql
CREATE TABLE public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category TEXT NOT NULL UNIQUE,
  retention_period INTERVAL NOT NULL,
  anonymize_instead_of_delete BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default policies
INSERT INTO public.data_retention_policies 
(data_category, retention_period, anonymize_instead_of_delete, description)
VALUES
('user_profile', INTERVAL '7 years', true, 'Basic user profile information'),
('strava_tokens', INTERVAL '1 year', false, 'OAuth tokens from Strava'),
('activity_data', INTERVAL '10 years', true, 'Workout and activity data'),
('heart_rate_data', INTERVAL '10 years', true, 'Heart rate measurements'),
('location_data', INTERVAL '2 years', true, 'GPS and location information'),
('consent_records', INTERVAL '10 years', false, 'Records of user consent');
```

#### 2. Automated Data Purging Mechanisms

Create a function to purge expired data:

```sql
CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS TABLE (
  category TEXT,
  records_processed INTEGER,
  anonymized INTEGER,
  deleted INTEGER
) AS $$
DECLARE
  v_policy RECORD;
  v_processed INTEGER;
  v_anonymized INTEGER;
  v_deleted INTEGER;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  -- Process each data category according to its policy
  FOR v_policy IN SELECT * FROM public.data_retention_policies LOOP
    v_processed := 0;
    v_anonymized := 0;
    v_deleted := 0;
    v_cutoff_date := now() - v_policy.retention_period;
    
    -- Handle user profiles
    IF v_policy.data_category = 'user_profile' THEN
      IF v_policy.anonymize_instead_of_delete THEN
        -- Anonymize profiles
        UPDATE public.profiles
        SET 
          first_name = 'Anonymized',
          last_name = 'User',
          profile_picture_url = NULL
        WHERE 
          updated_at < v_cutoff_date AND
          first_name != 'Anonymized';
          
        GET DIAGNOSTICS v_anonymized = ROW_COUNT;
      ELSE
        -- Delete profiles (cascades to related data)
        DELETE FROM public.profiles
        WHERE updated_at < v_cutoff_date;
        
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      END IF;
      v_processed := v_anonymized + v_deleted;
    
    -- Handle Strava tokens
    ELSIF v_policy.data_category = 'strava_tokens' THEN
      -- Always null out expired tokens for security
      UPDATE public.strava_athletes
      SET 
        encrypted_access_token = NULL,
        encrypted_refresh_token = NULL,
        strava_token_expires_at = NULL
      WHERE 
        updated_at < v_cutoff_date AND
        (encrypted_access_token IS NOT NULL OR encrypted_refresh_token IS NOT NULL);
        
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      v_processed := v_deleted;
    
    -- Add handlers for other data categories...
    END IF;
    
    -- Return results for this category
    category := v_policy.data_category;
    records_processed := v_processed;
    anonymized := v_anonymized;
    deleted := v_deleted;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Data Anonymization Strategies

Create functions for anonymizing different data types:

```sql
-- Function to anonymize location data
CREATE OR REPLACE FUNCTION public.anonymize_location_data(
  p_user_id UUID,
  p_precision INTEGER DEFAULT 2 -- Reduce precision to ~1km
)
RETURNS INTEGER AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Reduce precision of location data in activities
  UPDATE public.strava_activities
  SET 
    start_latlng = jsonb_build_array(
      round(start_latlng->0 * power(10, p_precision)) / power(10, p_precision),
      round(start_latlng->1 * power(10, p_precision)) / power(10, p_precision)
    ),
    end_latlng = jsonb_build_array(
      round(end_latlng->0 * power(10, p_precision)) / power(10, p_precision),
      round(end_latlng->1 * power(10, p_precision)) / power(10, p_precision)
    ),
    -- Replace detailed map polyline with simplified version
    map = jsonb_set(
      map, 
      '{summary_polyline}', 
      to_jsonb('ANONYMIZED')
    )
  WHERE 
    athlete_id IN (SELECT strava_id FROM public.strava_athletes WHERE user_id = p_user_id);
    
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN v_rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Data Subject Rights Implementation

#### 1. Access Request Handling

Create a function to compile all user data:

```sql
CREATE OR REPLACE FUNCTION public.compile_user_data_export(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_profile', (
      SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'created_at', created_at,
        'profile', row_to_json(p)
      )
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      WHERE u.id = p_user_id
    ),
    'strava_athlete', (
      SELECT jsonb_agg(row_to_json(sa))
      FROM public.strava_athletes sa
      JOIN public.profiles p ON p.strava_athlete_id = sa.strava_id
      WHERE p.user_id = p_user_id
    ),
    'activities', (
      SELECT jsonb_agg(row_to_json(a))
      FROM public.strava_activities a
      JOIN public.strava_athletes sa ON a.athlete_id = sa.strava_id
      JOIN public.profiles p ON p.strava_athlete_id = sa.strava_id
      WHERE p.user_id = p_user_id
    ),
    'consents', (
      SELECT jsonb_agg(row_to_json(c))
      FROM public.user_consents c
      WHERE c.user_id = p_user_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Data Portability Implementation

Create an API endpoint to export data in standard formats:

```typescript
// Example Next.js API route for data export
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Authenticate user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { data: userData, error } = await supabase.auth.getUser(req.headers.authorization)
  if (error) return res.status(401).json({ error: 'Unauthorized' })
  
  // Get user data
  const { data, error: dataError } = await supabase.rpc('compile_user_data_export', {
    p_user_id: userData.user.id
  })
  
  if (dataError) return res.status(500).json({ error: dataError.message })
  
  // Format as requested (JSON or CSV)
  const format = req.query.format || 'json'
  
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="data_export.json"')
    return res.status(200).json(data)
  } else if (format === 'csv') {
    // Convert JSON to CSV
    // ...
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="data_export.csv"')
    return res.status(200).send(csvData)
  }
  
  return res.status(400).json({ error: 'Invalid format requested' })
}
```

#### 3. Right to Erasure Mechanisms

Create a function to handle data deletion requests:

```sql
CREATE OR REPLACE FUNCTION public.process_erasure_request(
  p_user_id UUID,
  p_erasure_type TEXT DEFAULT 'partial' -- 'partial' or 'complete'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_strava_athlete_id BIGINT;
BEGIN
  -- Get Strava athlete ID
  SELECT strava_athlete_id INTO v_strava_athlete_id
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Record the erasure request
  INSERT INTO public.erasure_requests (
    user_id, 
    erasure_type, 
    requested_at,
    status
  ) VALUES (
    p_user_id,
    p_erasure_type,
    now(),
    'processing'
  );
  
  -- Handle different erasure types
  IF p_erasure_type = 'complete' THEN
    -- For complete erasure, we'll delete the user account
    -- This will cascade to all related data due to FK constraints
    DELETE FROM auth.users WHERE id = p_user_id;
    
    v_result = jsonb_build_object(
      'status', 'success',
      'message', 'User account and all associated data have been permanently deleted'
    );
  ELSE
    -- For partial erasure, anonymize but keep research data
    -- Anonymize profile
    UPDATE public.profiles
    SET 
      first_name = 'Anonymized',
      last_name = 'User',
      profile_picture_url = NULL
    WHERE user_id = p_user_id;
    
    -- Anonymize location data
    PERFORM public.anonymize_location_data(p_user_id, 1);
    
    -- Remove tokens
    IF v_strava_athlete_id IS NOT NULL THEN
      UPDATE public.strava_athletes
      SET 
        encrypted_access_token = NULL,
        encrypted_refresh_token = NULL,
        strava_token_expires_at = NULL
      WHERE strava_id = v_strava_athlete_id;
    END IF;
    
    v_result = jsonb_build_object(
      'status', 'success',
      'message', 'Personal data has been anonymized while preserving research data'
    );
  END IF;
  
  -- Update erasure request status
  UPDATE public.erasure_requests
  SET status = 'completed', completed_at = now()
  WHERE user_id = p_user_id AND status = 'processing';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. Data Rectification Processes

Create functions to handle data correction requests:

```sql
CREATE OR REPLACE FUNCTION public.process_rectification_request(
  p_user_id UUID,
  p_field_name TEXT,
  p_new_value TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Record the rectification request
  INSERT INTO public.rectification_requests (
    user_id, 
    field_name,
    new_value,
    requested_at,
    status
  ) VALUES (
    p_user_id,
    p_field_name,
    p_new_value,
    now(),
    'processing'
  );
  
  -- Handle different fields
  CASE p_field_name
    WHEN 'email' THEN
      -- Update email in auth.users
      UPDATE auth.users
      SET email = p_new_value
      WHERE id = p_user_id;
      
    WHEN 'first_name' THEN
      -- Update first_name in profiles
      UPDATE public.profiles
      SET first_name = p_new_value
      WHERE user_id = p_user_id;
      
    WHEN 'last_name' THEN
      -- Update last_name in profiles
      UPDATE public.profiles
      SET last_name = p_new_value
      WHERE user_id = p_user_id;
      
    ELSE
      -- Unknown field
      UPDATE public.rectification_requests
      SET 
        status = 'rejected', 
        completed_at = now(),
        notes = 'Unknown field: ' || p_field_name
      WHERE 
        user_id = p_user_id AND 
        field_name = p_field_name AND 
        status = 'processing';
        
      RETURN jsonb_build_object(
        'status', 'error',
        'message', 'Unknown field: ' || p_field_name
      );
  END CASE;
  
  -- Update rectification request status
  UPDATE public.rectification_requests
  SET status = 'completed', completed_at = now()
  WHERE 
    user_id = p_user_id AND 
    field_name = p_field_name AND 
    status = 'processing';
  
  v_result = jsonb_build_object(
    'status', 'success',
    'message', 'Field "' || p_field_name || '" has been updated successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
## Table-Specific Recommendations

### User/Profile Tables

#### Personal Data Fields Identification

In the `public.users` and `public.profiles` tables, the following fields contain personal data:

- `email` (users)
- `display_name` (users)
- `first_name` (profiles)
- `last_name` (profiles)
- `profile_picture_url` (profiles)

#### RLS Policies

```sql
-- For users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- For profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow researchers to view anonymized data
CREATE POLICY "Researchers can view anonymized profiles"
ON public.profiles
FOR SELECT
USING (
  -- Check if requesting user has researcher role
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'researcher'
  )
);
```

#### Encryption Needs

Profile data generally doesn't need encryption, but should be protected by RLS.

#### Data Minimization Strategies

```sql
-- Add constraints to enforce data minimization
ALTER TABLE public.profiles
ADD CONSTRAINT minimize_profile_data
CHECK (
  (first_name IS NULL OR length(first_name) <= 50) AND
  (last_name IS NULL OR length(last_name) <= 50)
);
```

### Strava Athlete Tables

#### OAuth Token Encryption

```sql
-- Modify strava_athletes table to use encrypted tokens
ALTER TABLE public.strava_athletes 
ADD COLUMN encrypted_access_token TEXT,
ADD COLUMN encrypted_refresh_token TEXT;

-- Create a migration function
CREATE OR REPLACE FUNCTION migrate_encrypt_strava_tokens(encryption_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.strava_athletes
  SET 
    encrypted_access_token = encode(
      pgp_sym_encrypt(
        strava_access_token,
        encryption_key,
        'cipher-algo=aes256'
      ),
      'base64'
    ),
    encrypted_refresh_token = encode(
      pgp_sym_encrypt(
        strava_refresh_token,
        encryption_key,
        'cipher-algo=aes256'
      ),
      'base64'
    ),
    strava_access_token = NULL,
    strava_refresh_token = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely retrieve tokens
CREATE OR REPLACE FUNCTION get_strava_tokens(
  p_strava_id BIGINT,
  encryption_key TEXT
)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN sa.encrypted_access_token IS NOT NULL THEN
        pgp_sym_decrypt(
          decode(sa.encrypted_access_token, 'base64'),
          encryption_key
        )::TEXT
      ELSE sa.strava_access_token
    END as access_token,
    CASE 
      WHEN sa.encrypted_refresh_token IS NOT NULL THEN
        pgp_sym_decrypt(
          decode(sa.encrypted_refresh_token, 'base64'),
          encryption_key
        )::TEXT
      ELSE sa.strava_refresh_token
    END as refresh_token,
    sa.strava_token_expires_at
  FROM public.strava_athletes sa
  WHERE sa.strava_id = p_strava_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Personal Data Protection

```sql
-- Enable RLS
ALTER TABLE public.strava_athletes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Strava data"
ON public.strava_athletes
FOR SELECT
USING (
  strava_id IN (
    SELECT strava_athlete_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own Strava data"
ON public.strava_athletes
FOR UPDATE
USING (
  strava_id IN (
    SELECT strava_athlete_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add constraints for data validation
ALTER TABLE public.strava_athletes
ADD CONSTRAINT validate_strava_athlete_data
CHECK (
  (weight IS NULL OR weight > 0) AND
  (measurement_preference IS NULL OR measurement_preference IN ('feet', 'meters'))
);
```

### Activity Data Tables

#### Location Data Handling

```sql
-- Enable RLS on activities table
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
ON public.strava_activities
FOR SELECT
USING (
  athlete_id IN (
    SELECT strava_athlete_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create function to reduce location precision for researchers
CREATE OR REPLACE FUNCTION get_anonymized_activities(precision INTEGER DEFAULT 2)
RETURNS TABLE (
  activity_id BIGINT,
  activity_name TEXT,
  activity_type TEXT,
  start_date TIMESTAMPTZ,
  distance NUMERIC,
  moving_time INTEGER,
  elapsed_time INTEGER,
  total_elevation_gain NUMERIC,
  start_latlng JSONB,
  end_latlng JSONB,
  average_speed NUMERIC,
  max_speed NUMERIC,
  average_heartrate NUMERIC,
  max_heartrate INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.strava_id,
    a.name,
    a.activity_type,
    a.start_date,
    a.distance,
    a.moving_time,
    a.elapsed_time,
    a.total_elevation_gain,
    -- Reduce precision of coordinates
    CASE WHEN a.start_latlng IS NOT NULL THEN
      jsonb_build_array(
        round((a.start_latlng->0)::numeric * power(10, precision)) / power(10, precision),
        round((a.start_latlng->1)::numeric * power(10, precision)) / power(10, precision)
      )
    ELSE NULL
    END as start_latlng,
    CASE WHEN a.end_latlng IS NOT NULL THEN
      jsonb_build_array(
        round((a.end_latlng->0)::numeric * power(10, precision)) / power(10, precision),
        round((a.end_latlng->1)::numeric * power(10, precision)) / power(10, precision)
      )
    ELSE NULL
    END as end_latlng,
    a.average_speed,
    a.max_speed,
    a.average_heartrate,
    a.max_heartrate
  FROM public.strava_activities a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Biometric Data Protection

```sql
-- Enable RLS on heart rate data
ALTER TABLE public.strava_activity_hr_stream_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own heart rate data"
ON public.strava_activity_hr_stream_points
FOR SELECT
USING (
  athlete_id IN (
    SELECT strava_athlete_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create function for aggregated heart rate data (for researchers)
CREATE OR REPLACE FUNCTION get_aggregated_heart_rate_data(
  p_activity_id BIGINT,
  p_interval_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  min_hr INTEGER,
  max_hr INTEGER,
  avg_hr NUMERIC,
  sample_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH time_buckets AS (
    SELECT 
      a.start_date + (hr.time_offset * INTERVAL '1 second') AS timestamp,
      hr.heart_rate,
      FLOOR(hr.time_offset / p_interval_seconds) AS bucket
    FROM 
      public.strava_activity_hr_stream_points hr
      JOIN public.strava_activities a ON hr.activity_id = a.strava_id
    WHERE 
      hr.activity_id = p_activity_id
  )
  SELECT 
    MIN(timestamp) AS time_bucket,
    MIN(heart_rate) AS min_hr,
    MAX(heart_rate) AS max_hr,
    ROUND(AVG(heart_rate), 2) AS avg_hr,
    COUNT(*) AS sample_count
  FROM time_buckets
  GROUP BY bucket
  ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Heart Rate/Biometric Tables

#### Special Category Data Protection

```sql
-- Add additional RLS policies for heart rate data
CREATE POLICY "Researchers can view anonymized heart rate data"
ON public.strava_activity_hr_stream_points
FOR SELECT
USING (
  -- Check if requesting user has researcher role
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'researcher'
  )
);

-- Create a view for researchers that anonymizes the data
CREATE OR REPLACE VIEW anonymized_heart_rate_data AS
SELECT 
  hr.activity_id,
  hr.time_offset,
  hr.heart_rate,
  a.activity_type,
  EXTRACT(YEAR FROM a.start_date) AS year,
  FLOOR(EXTRACT(YEAR FROM AGE(a.start_date, p.created_at)) / 10) * 10 AS age_bracket,
  CASE 
    WHEN p.first_name = 'Anonymized' THEN 'ANON'
    ELSE 'USER' || ROW_NUMBER() OVER (ORDER BY p.user_id)::TEXT
  END AS participant_id
FROM 
  public.strava_activity_hr_stream_points hr
  JOIN public.strava_activities a ON hr.activity_id = a.strava_id
  JOIN public.strava_athletes sa ON a.athlete_id = sa.strava_id
  JOIN public.profiles p ON p.strava_athlete_id = sa.strava_id;

-- Grant access to the view for researchers
GRANT SELECT ON anonymized_heart_rate_data TO researcher_role;
```

#### Anonymization Options

```sql
-- Function to anonymize heart rate data while preserving research value
CREATE OR REPLACE FUNCTION anonymize_heart_rate_data(
  p_user_id UUID,
  p_keep_data BOOLEAN DEFAULT true
)
RETURNS INTEGER AS $$
DECLARE
  v_strava_athlete_id BIGINT;
  v_rows_affected INTEGER;
BEGIN
  -- Get Strava athlete ID
  SELECT strava_athlete_id INTO v_strava_athlete_id
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF v_strava_athlete_id IS NULL THEN
    RETURN 0;
  END IF;
  
  IF p_keep_data THEN
    -- Anonymize by removing link to specific user but keep data for research
    UPDATE public.strava_activity_hr_stream_points
    SET athlete_id = -1 -- Special value for anonymized data
    WHERE athlete_id = v_strava_athlete_id;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  ELSE
    -- Delete heart rate data completely
    DELETE FROM public.strava_activity_hr_stream_points
    WHERE athlete_id = v_strava_athlete_id;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  END IF;
  
  RETURN v_rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Priority

### Critical Security Issues (Immediate Action)

1. **Enable Row Level Security on All Tables**
   - Start with tables containing personal data: `users`, `profiles`, `strava_athletes`
   - Implement basic policies to restrict access to own data
   - Test thoroughly before proceeding

2. **Encrypt OAuth Tokens**
   - Set up pgcrypto extension
   - Create encryption/decryption functions
   - Migrate existing tokens to encrypted format
   - Update application code to use encryption/decryption functions

3. **Implement Data Validation**
   - Add CHECK constraints to all tables
   - Validate data types and ranges
   - Ensure proper error handling for constraint violations

### High-Priority Data Protection Measures (1-2 Weeks)

1. **Implement Consent Management**
   - Create consent tables and functions
   - Develop UI for consent collection
   - Ensure consent is recorded with proper audit trail

2. **Set Up Data Retention Policies**
   - Define retention periods for different data categories
   - Implement automated purging mechanisms
   - Test with sample data

3. **Secure Biometric Data**
   - Apply special protection to heart rate data
   - Create anonymized views for research access
   - Implement aggregation functions for analysis

### Medium-Priority Compliance Features (2-4 Weeks)

1. **Implement Data Subject Rights**
   - Create functions for data export (access right)
   - Implement rectification mechanisms
   - Develop erasure workflows

2. **Enhance Documentation**
   - Add detailed comments to all database objects
   - Document GDPR compliance measures
   - Create developer guidelines

3. **Set Up Audit Logging**
   - Implement comprehensive audit logging
   - Create monitoring dashboards
   - Establish alert mechanisms

### Long-term Compliance Roadmap (Ongoing)

1. **Regular Compliance Reviews**
   - Schedule quarterly reviews of GDPR measures
   - Update policies as needed
   - Document all reviews

2. **Automated Compliance Testing**
   - Develop test suite for GDPR compliance
   - Integrate into CI/CD pipeline
   - Generate compliance reports

3. **User Privacy Dashboard**
   - Create UI for users to manage their privacy settings
   - Implement self-service data access
   - Provide transparency on data usage

## Ongoing Compliance Monitoring

### Regular Audit Procedures

1. **Quarterly Database Audits**
   - Review all tables for RLS policies
   - Check encryption of sensitive data
   - Verify data retention enforcement

2. **Access Control Reviews**
   - Audit user roles and permissions
   - Review API access patterns
   - Check for unauthorized access attempts

3. **Data Processing Audits**
   - Review data processing activities
   - Ensure processing aligns with consent
   - Document any changes to processing

### Compliance Testing Methodologies

1. **Automated Testing**
   - Create test scripts to verify RLS policies
   - Test data access from different user contexts
   - Validate encryption/decryption functions

2. **Manual Testing**
   - Perform regular penetration testing
   - Conduct user rights request tests
   - Verify data deletion processes

3. **Third-party Audits**
   - Consider annual third-party compliance audit
   - Address findings promptly
   - Document remediation actions

### Documentation Requirements

1. **Processing Activities Register**
   - Maintain detailed register of all data processing
   - Update when processing changes
   - Include legal basis for each activity

2. **Technical Measures Documentation**
   - Document all security measures
   - Keep encryption methods documented
   - Maintain database schema documentation

3. **Policy Documentation**
   - Keep privacy policies updated
   - Document internal data handling procedures
   - Maintain consent management documentation

### Incident Response Planning

1. **Data Breach Response Plan**
   - Define roles and responsibilities
   - Establish notification procedures
   - Create communication templates

2. **Remediation Procedures**
   - Define steps for containing breaches
   - Establish recovery procedures
   - Document lessons learned

3. **Regulatory Reporting**
   - Establish procedures for DPA notification
   - Create templates for breach notifications
   - Define thresholds for reporting

## Privacy Policy & Terms Template

### Research-Specific Privacy Policy Sections

```markdown
## Research Data Processing

### Purpose of Research
Our PhD research project on high exercise aims to [specific research goals]. We collect and process your fitness data, including heart rate measurements, activity details, and location data, solely for this research purpose.

### Legal Basis for Processing
We process your personal data based on your explicit consent. For special category data (such as heart rate information), we rely on your explicit consent and the scientific research provisions of GDPR Article 9(2)(j).

### Data Retention
We retain identifiable research data for [specific period] after collection. After this period, data is either anonymized or deleted according to our retention policy. Anonymized data may be retained indefinitely for research purposes.

### Research Results
Research findings will be published in aggregated, anonymized form only. No personally identifiable information will be included in any research publications or presentations.
```

### Data Processing Disclosures

```markdown
## Data We Collect

### Personal Information
- Basic profile information (name, email)
- Strava account information (when connected)
- Fitness activity data from Strava

### Special Category Data
- Heart rate measurements
- Other biometric data from connected devices

### Technical Data
- Device information
- IP address
- Browser type and version
- Usage patterns within the application

## How We Process Your Data

### Data Storage
All data is stored securely in our Supabase database hosted in [region]. We implement encryption, access controls, and other security measures to protect your data.

### Third-Party Processing
We use the following third-party services to process your data:
- Supabase for database hosting
- Strava API for fitness data retrieval
- [Other services as applicable]

### Automated Decision Making
We do not use your data for automated decision-making or profiling that would produce legal or similarly significant effects.
```

### User Rights Explanations

```markdown
## Your Rights Under GDPR

As a data subject, you have the following rights:

### Right to Access
You can request a copy of all personal data we hold about you. We will provide this information within 30 days of your request.

### Right to Rectification
If you believe any information we hold about you is inaccurate or incomplete, you can request that we correct it.

### Right to Erasure
You can request that we delete your personal data. Note that some anonymized data may be retained for research purposes.

### Right to Restrict Processing
You can request that we temporarily or permanently stop processing your personal data.

### Right to Data Portability
You can request a copy of your data in a structured, commonly used, and machine-readable format.

### Right to Object
You can object to our processing of your personal data at any time.

### How to Exercise Your Rights
To exercise any of these rights, please contact us at [contact email]. We will respond to your request within 30 days.
```

### Consent Management Details

```markdown
## Consent Management

### Granular Consent Options
We collect separate consent for:
- Participation in the research study
- Collection of fitness activity data
- Processing of heart rate and other biometric data
- Location data tracking
- Data sharing for research purposes

### Withdrawing Consent
You can withdraw your consent at any time by:
- Using the consent management section in your account settings
- Contacting us directly at [contact email]

### Consent Records
We maintain records of all consent provided, including:
- The specific consent given
- Date and time of consent
- Method of consent collection
- Version of privacy policy at time of consent

### Changes to Consent Terms
If we need to change how we process your data, we will:
- Notify you of the changes
- Request fresh consent if necessary
- Never apply new processing to historical data without appropriate consent
```