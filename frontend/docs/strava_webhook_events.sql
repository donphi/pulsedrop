-- Strava Webhook Events Table
-- Stores webhook events received from Strava for asynchronous processing
-- This table is used to queue events for processing and track their status

CREATE TABLE IF NOT EXISTS webhook_events (
  -- Unique identifier for the webhook event record
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- The complete webhook event data as received from Strava
  event_data JSONB NOT NULL,
  
  -- Processing status of the event
  -- pending: Event is waiting to be processed
  -- processing: Event is currently being processed
  -- completed: Event has been successfully processed
  -- failed: Event processing has failed after max retries
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Number of processing attempts made
  attempts INTEGER NOT NULL DEFAULT 0,
  
  -- When the event was received
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- When the event was processed (if completed or failed)
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error message if processing failed
  error_message TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events (created_at);

-- Create a function to clean up old webhook events
-- This helps prevent the table from growing too large
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  -- Delete completed events older than 30 days
  DELETE FROM webhook_events
  WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '30 days';
    
  -- Delete failed events older than 90 days
  DELETE FROM webhook_events
  WHERE status = 'failed'
    AND processed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Option 1: Create a trigger to automatically clean up old webhook events
-- Note: This requires setting up a trigger event, which might be complex for this use case

-- Option 2: Use Supabase scheduled functions (recommended)
-- Add this comment as a reminder to set up a scheduled function in the Supabase dashboard
-- or via the Supabase management API to run the cleanup_old_webhook_events() function daily
-- Example: https://supabase.com/docs/guides/database/functions#scheduled-functions

-- Note: If using Supabase Edge Functions, you can create a scheduled function like this:
/*
import { createClient } from '@supabase/supabase-js'

// This edge function would be scheduled to run daily
export async function scheduledCleanup() {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { error } = await supabaseAdmin.rpc('cleanup_old_webhook_events')
  if (error) console.error('Error cleaning up webhook events:', error)
}
*/

-- Create RLS policies for the webhook_events table
-- Only allow system services to access this table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy for system services (using service role)
-- Note: This assumes the auth.role() function exists and works as expected in your Supabase setup
CREATE POLICY webhook_events_service_policy ON webhook_events
  USING (auth.role() = 'service_role');

-- If the above doesn't work in your Supabase setup, you might need to use this alternative:
-- CREATE POLICY webhook_events_service_policy ON webhook_events
--   USING (true); -- Allow all operations when using service role key
-- And then ensure you only access this table using the service role client

-- Comment on table and columns for documentation
COMMENT ON TABLE webhook_events IS 'Stores Strava webhook events for asynchronous processing';
COMMENT ON COLUMN webhook_events.id IS 'Unique identifier for the webhook event record';
COMMENT ON COLUMN webhook_events.event_data IS 'Complete webhook event data as received from Strava';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN webhook_events.attempts IS 'Number of processing attempts made';
COMMENT ON COLUMN webhook_events.created_at IS 'When the event was received';
COMMENT ON COLUMN webhook_events.processed_at IS 'When the event was processed (if completed or failed)';
COMMENT ON COLUMN webhook_events.error_message IS 'Error message if processing failed';