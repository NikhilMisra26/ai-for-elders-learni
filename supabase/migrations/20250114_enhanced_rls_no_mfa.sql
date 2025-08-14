-- Migration: 20250114_enhanced_rls_no_mfa.sql
-- Description: Enhanced Row Level Security policies with rate limiting, security logging, and fraud detection
-- Author: database-schema-designer
-- Run SECOND (after main schema). Idempotent-safe.
-- Dependencies: Requires main schema (20250114_initial_schema.sql) to be applied first

-- ============================================
-- EXTENSIONS
-- ============================================
-- Ensure needed extensions for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SETUP: Security audit logging table
-- ============================================
-- Table for tracking security-relevant events and user actions
-- Used for rate limiting, suspicious activity detection, and audit trails
CREATE TABLE IF NOT EXISTS public.security_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,
    details     JSONB DEFAULT '{}'::jsonb,
    ip_address  INET,  -- Can be populated by edge functions
    user_agent  TEXT,  -- Can be populated by edge functions
    success     BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT security_logs_action_check CHECK (action <> '')
);

-- Indexes for security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id      ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action       ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at   ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_action  ON public.security_logs(user_id, action, created_at DESC);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RATE LIMITING FUNCTION
-- ============================================
-- Checks if a user has exceeded the rate limit for a specific action
-- Returns TRUE if within limits, FALSE if rate limit exceeded
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_action TEXT,
    p_limit_count INT DEFAULT 10,
    p_window_minutes INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_count INT;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();

    -- If no user context, allow action (RLS will handle auth)
    IF v_user_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Count recent requests for this action by this user
    SELECT COUNT(*) INTO v_request_count
    FROM public.security_logs
    WHERE user_id = v_user_id
      AND action = p_action
      AND created_at > NOW() - (p_window_minutes || ' minutes')::interval;

    -- Check if limit exceeded
    IF v_request_count >= p_limit_count THEN
        -- Log rate limit violation
        INSERT INTO public.security_logs (user_id, action, details, success)
        VALUES (v_user_id, 'rate_limit_exceeded', 
                jsonb_build_object('original_action', p_action, 'limit', p_limit_count, 'window_minutes', p_window_minutes),
                false);
        RETURN FALSE;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- On any error, err on the side of allowing the action
        RETURN TRUE;
END;
$$;

-- ============================================
-- SECURITY LOGGING FUNCTION
-- ============================================
-- Logs security-relevant actions for audit and monitoring
-- Silently fails to avoid breaking main application flows
CREATE OR REPLACE FUNCTION public.log_security_action(
    p_action TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Attempt to log the security action
    INSERT INTO public.security_logs (user_id, action, details, ip_address, user_agent, success, created_at)
    VALUES (
        auth.uid(),
        p_action,
        p_details,
        NULL,  -- IP address can be captured at edge/middleware
        NULL,  -- User agent can be captured at edge/middleware
        p_success,
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail to avoid breaking main application flows
        -- Could optionally log to a system table or raise notice for debugging
        RAISE NOTICE 'Failed to log security action: % - %', p_action, SQLERRM;
END;
$$;

-- ============================================
-- USER / SUBSCRIPTION HELPER FUNCTIONS
-- ============================================

-- Check if the current user is verified
-- Returns FALSE if user not found or not verified
CREATE OR REPLACE FUNCTION public.is_user_verified()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    SELECT verified INTO v_verified
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_verified, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        -- Return FALSE on any error
        RETURN FALSE;
END;
$$;

-- Get the current user's subscription tier
-- Returns 'free' if user not found or tier not set
CREATE OR REPLACE FUNCTION public.get_user_tier()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT tier INTO v_tier
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_tier, 'free');
EXCEPTION
    WHEN OTHERS THEN
        -- Return 'free' tier on any error
        RETURN 'free';
END;
$$;

-- Detect suspicious behavior patterns
-- Returns TRUE if suspicious activity detected, FALSE otherwise
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rapid_changes INT;
    v_failed_attempts INT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Check for NULL user ID
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check for rapid profile updates
    IF p_action = 'profile_update' THEN
        SELECT COUNT(*) INTO v_rapid_changes
        FROM public.security_logs
        WHERE user_id = v_user_id
          AND action = 'profile_update'
          AND created_at > NOW() - INTERVAL '5 minutes';

        IF v_rapid_changes > 5 THEN
            -- Log suspicious activity
            PERFORM log_security_action('suspicious_activity_detected', 
                jsonb_build_object('type', 'rapid_profile_updates', 'count', v_rapid_changes),
                false);
            RETURN TRUE;
        END IF;
    END IF;

    -- Check for excessive failed authentication attempts
    IF p_action = 'auth_failed' THEN
        SELECT COUNT(*) INTO v_failed_attempts
        FROM public.security_logs
        WHERE user_id = v_user_id
          AND action = 'auth_failed'
          AND created_at > NOW() - INTERVAL '10 minutes';

        IF v_failed_attempts > 10 THEN
            -- Log suspicious activity
            PERFORM log_security_action('suspicious_activity_detected',
                jsonb_build_object('type', 'excessive_failed_auth', 'count', v_failed_attempts),
                false);
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
EXCEPTION
    WHEN OTHERS THEN
        -- Return FALSE on any error (don't block legitimate users)
        RETURN FALSE;
END;
$$;

-- Validate email change request
-- Checks for duplicate emails and rate limits email changes
-- Returns TRUE if email change is allowed, FALSE otherwise
CREATE OR REPLACE FUNCTION public.validate_email_change(
    p_new_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email_exists BOOLEAN;
    v_recent_changes INT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Check for NULL user ID
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if email already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = lower(trim(p_new_email)))
    INTO v_email_exists;

    IF v_email_exists THEN
        -- Log attempted duplicate email
        PERFORM log_security_action('email_change_rejected',
            jsonb_build_object('reason', 'email_already_exists', 'email', p_new_email),
            false);
        RETURN FALSE;
    END IF;

    -- Check for recent email changes (rate limiting)
    SELECT COUNT(*) INTO v_recent_changes
    FROM public.security_logs
    WHERE user_id = v_user_id
      AND action = 'email_change'
      AND created_at > NOW() - INTERVAL '7 days';

    IF v_recent_changes >= 2 THEN
        -- Log rate limit violation
        PERFORM log_security_action('email_change_rejected',
            jsonb_build_object('reason', 'rate_limit', 'recent_changes', v_recent_changes),
            false);
        RETURN FALSE;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and deny email change
        PERFORM log_security_action('email_change_error',
            jsonb_build_object('error', SQLERRM),
            false);
        RETURN FALSE;
END;
$$;

-- Check for subscription fraud patterns
-- Detects rapid subscription changes and past payment disputes
-- Returns TRUE if fraud signals detected, FALSE otherwise
CREATE OR REPLACE FUNCTION public.check_subscription_fraud(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rapid_subscriptions INT;
    v_chargebacks INT;
    v_column_exists BOOLEAN;
BEGIN
    -- Validate user ID
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if created_at column exists in subscriptions table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'created_at'
    ) INTO v_column_exists;

    IF v_column_exists THEN
        -- Check for rapid subscription changes
        SELECT COUNT(*) INTO v_rapid_subscriptions
        FROM public.subscriptions
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days';

        IF v_rapid_subscriptions > 3 THEN
            -- Log fraud signal
            PERFORM log_security_action('fraud_signal_detected',
                jsonb_build_object('type', 'rapid_subscriptions', 'count', v_rapid_subscriptions, 'user_id', p_user_id),
                false);
            RETURN TRUE;
        END IF;
    ELSE
        -- Fallback: check subscription count without date filter
        SELECT COUNT(*) INTO v_rapid_subscriptions
        FROM public.subscriptions
        WHERE user_id = p_user_id;

        IF v_rapid_subscriptions > 5 THEN
            PERFORM log_security_action('fraud_signal_detected',
                jsonb_build_object('type', 'excessive_subscriptions', 'count', v_rapid_subscriptions, 'user_id', p_user_id),
                false);
            RETURN TRUE;
        END IF;
    END IF;

    -- Check for payment disputes/chargebacks
    SELECT COUNT(*) INTO v_chargebacks
    FROM public.invoices
    WHERE user_id = p_user_id
      AND status IN ('disputed', 'refunded', 'chargeback');

    IF v_chargebacks > 0 THEN
        -- Log fraud signal
        PERFORM log_security_action('fraud_signal_detected',
            jsonb_build_object('type', 'payment_disputes', 'count', v_chargebacks, 'user_id', p_user_id),
            false);
        RETURN TRUE;
    END IF;

    RETURN FALSE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block user
        PERFORM log_security_action('fraud_check_error',
            jsonb_build_object('error', SQLERRM, 'user_id', p_user_id),
            false);
        RETURN FALSE;
END;
$$;

-- Check if user has access to a specific tier level
-- Used to gate access to tier-specific content
-- Returns TRUE if user has required tier or higher, FALSE otherwise
CREATE OR REPLACE FUNCTION public.check_tier_access(
    p_required_tier TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_tier TEXT;
    v_required_level INT;
    v_user_level INT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Check for NULL user ID
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get user's current tier
    SELECT tier INTO v_user_tier
    FROM public.profiles
    WHERE id = v_user_id;

    -- Default to 'free' if no tier found
    v_user_tier := COALESCE(v_user_tier, 'free');

    -- Map tier names to numeric levels for comparison
    v_user_level := CASE lower(v_user_tier)
        WHEN 'expert' THEN 3
        WHEN 'advanced' THEN 2
        WHEN 'free' THEN 1
        ELSE 1  -- Default to free tier
    END;

    v_required_level := CASE lower(p_required_tier)
        WHEN 'expert' THEN 3
        WHEN 'advanced' THEN 2
        WHEN 'free' THEN 1
        ELSE 1  -- Default to free tier
    END;

    -- Check if user has required tier or higher
    RETURN v_user_level >= v_required_level;
EXCEPTION
    WHEN OTHERS THEN
        -- Return FALSE on any error (deny access)
        RETURN FALSE;
END;
$$;

-- Clean up old security logs to manage table size
-- Removes logs older than 90 days
-- Should be called periodically via a scheduled job
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    -- Delete old logs and get count
    WITH deleted AS (
        DELETE FROM public.security_logs
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    -- Log cleanup action if any records were deleted
    IF v_deleted_count > 0 THEN
        PERFORM log_security_action('security_logs_cleanup',
            jsonb_build_object('deleted_count', v_deleted_count),
            true);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log cleanup error
        PERFORM log_security_action('security_logs_cleanup_error',
            jsonb_build_object('error', SQLERRM),
            false);
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant execution permissions to authenticated users only
-- Anonymous users should not have access to these security functions

-- Rate limiting and logging functions
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_action(TEXT, JSONB, BOOLEAN) TO authenticated;

-- User verification and tier functions
GRANT EXECUTE ON FUNCTION public.is_user_verified() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_tier_access(TEXT) TO authenticated;

-- Security validation functions
GRANT EXECUTE ON FUNCTION public.validate_email_change(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_fraud(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_suspicious_activity(TEXT) TO authenticated;

-- Maintenance functions (consider restricting to service role in production)
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs() TO authenticated;

-- ============================================
-- GRANULAR RLS POLICIES WITH RATE LIMITING
-- ============================================
-- These policies replace basic RLS with enhanced security checks
-- Each policy includes rate limiting to prevent abuse

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================
-- Drop existing policies to replace with enhanced versions
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    AND check_rate_limit('profile_read', 100, 1)
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND check_rate_limit('profile_create', 2, 60)
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    AND check_rate_limit('profile_update', 60, 1)
  )
  WITH CHECK (auth.uid() = id);

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================
-- Subscriptions are read-only from client (managed by backend/webhooks)
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('subscription_read', 60, 1)
  );

-- ============================================
-- INVOICES TABLE POLICIES
-- ============================================
-- Invoices are read-only from client (managed by payment system)
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;

CREATE POLICY "invoices_select_own"
  ON public.invoices
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('invoice_read', 30, 1)
  );

-- ============================================
-- COURSE PROGRESS TABLE POLICIES
-- ============================================
-- Users can manage their own course progress with rate limiting
DROP POLICY IF EXISTS "course_progress_select_own" ON public.course_progress;
DROP POLICY IF EXISTS "course_progress_insert_own" ON public.course_progress;
DROP POLICY IF EXISTS "course_progress_update_own" ON public.course_progress;

CREATE POLICY "course_progress_select_own"
  ON public.course_progress
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('progress_read', 100, 1)
  );

CREATE POLICY "course_progress_insert_own"
  ON public.course_progress
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND check_rate_limit('progress_create', 50, 60)
    AND NOT EXISTS (
      SELECT 1 FROM public.course_progress cp
      WHERE cp.user_id = auth.uid() AND cp.course_id = course_id
    )
  );

CREATE POLICY "course_progress_update_own"
  ON public.course_progress
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND check_rate_limit('progress_update', 200, 1)
  )
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- MODULE PROGRESS TABLE POLICIES
-- ============================================
-- Users can manage their own module progress with rate limiting
DROP POLICY IF EXISTS "module_progress_select_own" ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_insert_own" ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_update_own" ON public.module_progress;

CREATE POLICY "module_progress_select_own"
  ON public.module_progress
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('module_read', 200, 1)
  );

CREATE POLICY "module_progress_insert_own"
  ON public.module_progress
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND check_rate_limit('module_create', 200, 60)
  );

CREATE POLICY "module_progress_update_own"
  ON public.module_progress
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND check_rate_limit('module_update', 200, 1)
  )
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- USER ACTIVITY TABLE POLICIES
-- ============================================
-- Users can only read their own activity logs (inserts handled by backend)
DROP POLICY IF EXISTS "user_activity_select_own" ON public.user_activity;

CREATE POLICY "user_activity_select_own"
  ON public.user_activity
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('activity_read', 100, 1)
  );

-- ============================================
-- SECURITY LOGS TABLE POLICIES
-- ============================================
-- Users can only read their own security logs for transparency
DROP POLICY IF EXISTS "security_logs_select_own" ON public.security_logs;

CREATE POLICY "security_logs_select_own"
  ON public.security_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND check_rate_limit('security_log_read', 20, 1)
  );

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
-- Additional indexes to optimize common query patterns

-- Subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- Invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON public.invoices(user_id, date DESC);

-- Progress tracking queries
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON public.course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_course_module ON public.module_progress(user_id, course_id, module_id);

-- ============================================
-- MIGRATION COMPLETION
-- ============================================
-- Log successful migration completion
DO $$
BEGIN
    PERFORM log_security_action('migration_completed',
        jsonb_build_object('migration', '20250114_enhanced_rls_no_mfa', 'timestamp', NOW()),
        true);
EXCEPTION
    WHEN OTHERS THEN
        -- Silently continue if logging fails
        NULL;
END $$;
