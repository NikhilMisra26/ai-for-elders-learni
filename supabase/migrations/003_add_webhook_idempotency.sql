-- Add webhook events table for idempotency handling
-- This prevents duplicate processing of Stripe webhook events

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid primary key default uuid_generate_v4(),
  event_id text not null unique, -- Stripe event ID
  event_type text not null,
  processed_at timestamptz not null default now(),
  processing_result text, -- 'success', 'failed', or error message
  metadata jsonb, -- Store relevant event data for debugging
  created_at timestamptz not null default now()
);

-- Create index for faster lookups by event_id
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

-- Create index for cleanup queries (remove old processed events)
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Add comment for documentation
COMMENT ON TABLE public.webhook_events IS 'Tracks processed Stripe webhook events to prevent duplicate processing';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Unique Stripe event ID';
COMMENT ON COLUMN public.webhook_events.event_type IS 'Type of Stripe webhook event (e.g., checkout.session.completed)';
COMMENT ON COLUMN public.webhook_events.processing_result IS 'Result of processing: success, failed, or error message';
COMMENT ON COLUMN public.webhook_events.metadata IS 'Event metadata for debugging and audit purposes';

-- Row Level Security - Only service role can access (webhooks run with service role)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No public policies needed - this table is only accessed by the webhook service
-- The service uses the service role key which bypasses RLS

-- Function to check if webhook event was already processed
CREATE OR REPLACE FUNCTION public.is_webhook_event_processed(stripe_event_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.webhook_events
    WHERE event_id = stripe_event_id
    AND processing_result = 'success'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record webhook event processing
CREATE OR REPLACE FUNCTION public.record_webhook_event(
  stripe_event_id text,
  stripe_event_type text,
  result text DEFAULT 'success',
  event_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  webhook_record_id uuid;
BEGIN
  INSERT INTO public.webhook_events (event_id, event_type, processing_result, metadata)
  VALUES (stripe_event_id, stripe_event_type, result, event_metadata)
  RETURNING id INTO webhook_record_id;
  
  RETURN webhook_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old webhook events (optional - for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events(days_old integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_events
  WHERE created_at < now() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_webhook_event_processed IS 'Check if a Stripe webhook event was already successfully processed';
COMMENT ON FUNCTION public.record_webhook_event IS 'Record a processed webhook event for idempotency tracking';
COMMENT ON FUNCTION public.cleanup_old_webhook_events IS 'Clean up old webhook event records (default: 90 days)';