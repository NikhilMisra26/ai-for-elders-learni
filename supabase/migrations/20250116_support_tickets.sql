-- Migration: 20250116_support_tickets.sql
-- Description: Add support tickets table for customer support email tracking
-- Author: API Endpoint Specialist
-- Dependencies: Requires main schema and enhanced RLS to be applied first

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
-- Create support_tickets table for tracking customer support requests
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'failed')),
    error_message TEXT, -- For tracking email sending failures
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT support_tickets_message_check CHECK (char_length(message) >= 10 AND char_length(message) <= 5000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON public.support_tickets(user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR SUPPORT TICKETS
-- ============================================

-- Users can view their own support tickets
CREATE POLICY "support_tickets_select_own"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.check_rate_limit('support_ticket_read', 50, 1)
  );

-- Support tickets can only be created via Edge Function (service role)
-- No INSERT policy for authenticated users

-- Users cannot update their own tickets directly
-- Updates should be done through Edge Functions or admin interface

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant SELECT permission to authenticated users (for viewing their tickets)
GRANT SELECT ON public.support_tickets TO authenticated;

-- ============================================
-- HELPER FUNCTION FOR ANALYTICS
-- ============================================
-- Get support ticket metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_support_metrics(
    p_time_window_days INT DEFAULT 30
)
RETURNS TABLE (
    total_tickets BIGINT,
    pending_tickets BIGINT,
    resolved_tickets BIGINT,
    average_resolution_hours NUMERIC,
    tickets_by_status JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(*) as total_tickets,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_tickets,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
                FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL) as avg_resolution_hours
        FROM public.support_tickets
        WHERE created_at > NOW() - (p_time_window_days || ' days')::interval
    ),
    status_breakdown AS (
        SELECT jsonb_object_agg(status, count) as tickets_by_status
        FROM (
            SELECT status, COUNT(*) as count
            FROM public.support_tickets
            WHERE created_at > NOW() - (p_time_window_days || ' days')::interval
            GROUP BY status
        ) s
    )
    SELECT 
        m.total_tickets,
        m.pending_tickets,
        m.resolved_tickets,
        ROUND(m.avg_resolution_hours, 2),
        COALESCE(s.tickets_by_status, '{}'::jsonb)
    FROM metrics m
    CROSS JOIN status_breakdown s;
END;
$$;

-- Grant execute permission for metrics function (admin use)
GRANT EXECUTE ON FUNCTION public.get_support_metrics(INT) TO authenticated;

-- ============================================
-- MIGRATION COMPLETION LOG
-- ============================================
DO $$
BEGIN
    PERFORM public.log_security_action('migration_completed',
        jsonb_build_object('migration', '20250116_support_tickets', 'timestamp', NOW()),
        true);
EXCEPTION
    WHEN OTHERS THEN
        -- Silently continue if logging fails
        NULL;
END $$;