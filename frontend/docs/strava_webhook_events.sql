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
  error_message TEXT,
  
  -- Index on status for efficient querying of pending events
  INDEX idx_webhook_events_status (status),
  
  -- Index on created_at for time-based queries
  INDEX idx_webhook_events_created_at (created_at)
);

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

-- Create a trigger to automatically clean up old webhook events
-- This runs once a day at midnight
CREATE OR REPLACE FUNCTION trigger_cleanup_old_webhook_events()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM cleanup_old_webhook_events();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function
-- This ensures the table doesn't grow too large over time
SELECT cron.schedule(
  'cleanup-webhook-events',
  '0 0 * * *', -- Run at midnight every day
  'SELECT cleanup_old_webhook_events()'
);

-- Create RLS policies for the webhook_events table
-- Only allow system services to access this table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy for system services (using service role)
CREATE POLICY webhook_events_service_policy ON webhook_events
  USING (auth.role() = 'service_role');

-- Comment on table and columns for documentation
COMMENT ON TABLE webhook_events IS 'Stores Strava webhook events for asynchronous processing';
COMMENT ON COLUMN webhook_events.id IS 'Unique identifier for the webhook event record';
COMMENT ON COLUMN webhook_events.event_data IS 'Complete webhook event data as received from Strava';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN webhook_events.attempts IS 'Number of processing attempts made';
COMMENT ON COLUMN webhook_events.created_at IS 'When the event was received';
COMMENT ON COLUMN webhook_events.processed_at IS 'When the event was processed (if completed or failed)';
COMMENT ON COLUMN webhook_events.error_message IS 'Error message if processing failed';