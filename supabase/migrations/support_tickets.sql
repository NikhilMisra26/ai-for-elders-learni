-- ============================================================================
-- Support Tickets System for DISCOVER 50 AI
-- Version: 1.0.0
-- Description: Production-ready support ticket system with optimized RLS and rate limiting
-- Author: Claude
-- ============================================================================

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- SUPPORT TICKETS TABLE
-- =========================
-- Main table for storing user support tickets with denormalized user data
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ticket content
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed', 'failed')),
    
    -- Denormalized user data for quick admin access
    user_email TEXT NOT NULL,
    user_name TEXT,
    user_tier TEXT DEFAULT 'free',
    
    -- Response tracking
    admin_response TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    error_message TEXT, -- For tracking email sending failures
    
    -- Metadata
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'account', 'course_content', 'other')),
    
    -- Audit columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.support_tickets IS 'User support tickets with rate limiting and comprehensive tracking';
COMMENT ON COLUMN public.support_tickets.user_email IS 'Denormalized email captured at ticket creation for historical accuracy';
COMMENT ON COLUMN public.support_tickets.user_name IS 'Denormalized name captured at ticket creation for historical accuracy';
COMMENT ON COLUMN public.support_tickets.status IS 'Ticket status: pending (new), in_progress (being handled), resolved (solution provided), closed (archived), failed (email failed)';

-- =========================
-- RATE LIMITING TABLE
-- =========================
-- Tracks support ticket creation attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limiting_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'ticket_create' CHECK (action_type IN ('ticket_create', 'email_send')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.rate_limiting_support IS 'Rate limiting tracking for support system actions';
COMMENT ON COLUMN public.rate_limiting_support.action_type IS 'Type of action being rate limited';

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

-- Support tickets indexes (no WHERE clauses with NOW() to avoid immutable function errors)
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id 
    ON public.support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
    ON public.support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at 
    ON public.support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status 
    ON public.support_tickets(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_pending
    ON public.support_tickets(priority, status)
    WHERE status = 'pending'; -- Static WHERE clause is fine

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limiting_support_user_time 
    ON public.rate_limiting_support(user_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limiting_support_created_at 
    ON public.rate_limiting_support(created_at DESC);

-- =========================
-- TRIGGERS
-- =========================

-- Update trigger for support_tickets
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SECURITY DEFINER FUNCTIONS (Bypass RLS for performance)
-- =========================

-- Function to check if user is rate limited (uses SECURITY DEFINER to bypass RLS on rate_limiting_support)
CREATE OR REPLACE FUNCTION public.check_support_rate_limit(
    p_user_id UUID,
    p_action_type TEXT DEFAULT 'ticket_create',
    p_limit INTEGER DEFAULT 3,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS for performance
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count recent actions within the time window
    SELECT COUNT(*)
    INTO v_count
    FROM public.rate_limiting_support
    WHERE user_id = p_user_id
        AND action_type = p_action_type
        AND created_at > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);
    
    -- Return true if under limit, false if rate limited
    RETURN v_count < p_limit;
END;
$$;

COMMENT ON FUNCTION public.check_support_rate_limit IS 'Checks if user has exceeded rate limit for support actions';

-- Function to create a support ticket with rate limiting
CREATE OR REPLACE FUNCTION public.create_support_ticket(
    p_message TEXT,
    p_category TEXT DEFAULT 'general',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS for performance
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_user_tier TEXT;
    v_ticket_id UUID;
BEGIN
    -- Get current user ID (wrapped in SELECT for performance)
    v_user_id := (SELECT auth.uid());
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a support ticket';
    END IF;
    
    -- Acquire transaction-scoped advisory lock keyed by user ID to prevent race conditions
    -- Convert UUID to int64 using hash for stable locking key
    PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));
    
    -- Check rate limit (3 tickets per hour by default)
    IF NOT check_support_rate_limit(v_user_id, 'ticket_create', 3, 60) THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before creating another ticket.';
    END IF;
    
    -- Get user information from profiles table
    SELECT 
        COALESCE(p.email, au.email, 'unknown@email.com'),
        COALESCE(p.name, 'Unknown User'),
        COALESCE(p.tier, 'free')
    INTO v_user_email, v_user_name, v_user_tier
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE au.id = v_user_id;
    
    -- Create the ticket
    INSERT INTO public.support_tickets (
        user_id,
        message,
        category,
        priority,
        user_email,
        user_name,
        user_tier
    ) VALUES (
        v_user_id,
        p_message,
        p_category,
        p_priority,
        v_user_email,
        v_user_name,
        v_user_tier
    ) RETURNING id INTO v_ticket_id;
    
    -- Record the rate limiting entry
    INSERT INTO public.rate_limiting_support (user_id, action_type)
    VALUES (v_user_id, 'ticket_create');
    
    RETURN v_ticket_id;
END;
$$;

COMMENT ON FUNCTION public.create_support_ticket IS 'Creates a support ticket with rate limiting enforcement';

-- Function to clean up old rate limiting entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.rate_limiting_support
    WHERE created_at < (NOW() - INTERVAL '2 hours');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN COALESCE(v_deleted_count, 0);
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_rate_limits IS 'Removes rate limiting entries older than 2 hours';

-- Function to auto-populate user data on ticket insert
CREATE OR REPLACE FUNCTION public.populate_ticket_user_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only populate if not already set (allows manual override)
    IF NEW.user_email IS NULL OR NEW.user_name IS NULL OR NEW.user_tier IS NULL THEN
        SELECT 
            COALESCE(NEW.user_email, p.email, au.email, 'unknown@email.com'),
            COALESCE(NEW.user_name, p.name, 'Unknown User'),
            COALESCE(NEW.user_tier, p.tier, 'free')
        INTO NEW.user_email, NEW.user_name, NEW.user_tier
        FROM auth.users au
        LEFT JOIN public.profiles p ON p.id = au.id
        WHERE au.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add trigger to auto-populate user data
DROP TRIGGER IF EXISTS populate_ticket_user_data_trigger ON public.support_tickets;
CREATE TRIGGER populate_ticket_user_data_trigger
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_ticket_user_data();

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

-- Enable RLS on both tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limiting_support ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for clean state)
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update their own pending tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Rate limiting is per user" ON public.rate_limiting_support;
DROP POLICY IF EXISTS "System can clean up old entries" ON public.rate_limiting_support;

-- Support Tickets Policies (using wrapped auth.uid() for performance)

-- Policy: Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
    ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND status = 'pending'
    );

-- Policy: Users can view only their own tickets
CREATE POLICY "Users can view their own tickets"
    ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Policy: Users can update only their own pending tickets (within 24 hours)
CREATE POLICY "Users can update their own pending tickets"
    ON public.support_tickets
    FOR UPDATE
    TO authenticated
    USING (
        user_id = (SELECT auth.uid()) 
        AND status = 'pending'
        AND created_at > (NOW() - INTERVAL '24 hours')
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND status = 'pending' -- Cannot change status
    );

-- Rate Limiting Policies

-- Policy: Rate limiting entries are per-user only
CREATE POLICY "Rate limiting is per user"
    ON public.rate_limiting_support
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Allow cleanup of old entries (for maintenance)
CREATE POLICY "System can clean up old entries"
    ON public.rate_limiting_support
    FOR DELETE
    TO service_role
    USING (created_at < (NOW() - INTERVAL '2 hours'));
-- =========================
-- GRANT PERMISSIONS
-- =========================
-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.rate_limiting_support TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_support_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits TO authenticated;

-- =========================
-- SUCCESS MESSAGE
-- =========================
DO $$
BEGIN
    RAISE NOTICE '✅ Support tickets system successfully created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '- Support tickets table with comprehensive tracking';
    RAISE NOTICE '- Rate limiting (3 tickets per hour per user)';
    RAISE NOTICE '- Optimized RLS policies with wrapped auth.uid()';
    RAISE NOTICE '- Security definer functions for performance';
    RAISE NOTICE '- Auto-population of user data';
    RAISE NOTICE '- Proper indexes for query performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy Edge Function for email sending';
    RAISE NOTICE '2. Configure Resend API key';
    RAISE NOTICE '3. Test the support dialog';
END $$;

-- =========================
-- MIGRATION ROLLBACK (if needed)
-- =========================
-- To rollback this migration, run:
/*
DROP POLICY IF EXISTS "System can clean up old entries" ON public.rate_limiting_support;
DROP POLICY IF EXISTS "Rate limiting is per user" ON public.rate_limiting_support;
DROP POLICY IF EXISTS "Users can update their own pending tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;

DROP TRIGGER IF EXISTS populate_ticket_user_data_trigger ON public.support_tickets;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;

DROP FUNCTION IF EXISTS public.populate_ticket_user_data();
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();
DROP FUNCTION IF EXISTS public.create_support_ticket(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_support_rate_limit(UUID, TEXT, INTEGER, INTEGER);

DROP TABLE IF EXISTS public.rate_limiting_support CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
*/