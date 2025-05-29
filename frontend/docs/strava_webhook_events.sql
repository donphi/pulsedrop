-- Strava Webhook Events Table
-- Stores webhook events received from Strava for asynchronous processing
-- This table is used to queue events for processing and track their status

CREATE TABLE IF NOT EXISTS public.webhook_events (
  -- Unique identifier for the webhook event record
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- When the event was processed (if completed or failed)
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error message if processing failed
  error_message TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events (created_at);

-- Create a function to clean up old webhook events
-- This helps prevent the table from growing too large
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  -- Delete completed events older than 30 days
  DELETE FROM public.webhook_events
  WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '30 days';
    
  -- Delete failed events older than 90 days
  DELETE FROM public.webhook_events
  WHERE status = 'failed'
    AND processed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for the webhook_events table
-- Only allow system services to access this table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- **CRITICAL: Service role bypass**
CREATE POLICY "Service role bypass"
ON public.webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can access webhook events
CREATE POLICY "Admins can access webhook events"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Comment on table and columns for documentation
COMMENT ON TABLE public.webhook_events IS 'Stores Strava webhook events for asynchronous processing';
COMMENT ON COLUMN public.webhook_events.id IS 'Unique identifier for the webhook event record';
COMMENT ON COLUMN public.webhook_events.event_data IS 'Complete webhook event data as received from Strava';
COMMENT ON COLUMN public.webhook_events.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN public.webhook_events.attempts IS 'Number of processing attempts made';
COMMENT ON COLUMN public.webhook_events.created_at IS 'When the event was received';
COMMENT ON COLUMN public.webhook_events.processed_at IS 'When the event was processed (if completed or failed)';
COMMENT ON COLUMN public.webhook_events.error_message IS 'Error message if processing failed';