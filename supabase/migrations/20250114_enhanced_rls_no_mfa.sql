-- Migration: 20250114_enhanced_rls_no_mfa.sql
-- Description: Enterprise-grade Row Level Security with optimized auth calls, comprehensive rate limiting, 
--              security logging, fraud detection, and session validation
-- Author: database-schema-designer
-- Version: 2.0 - Enhanced for Supabase 2025 with performance optimizations
-- Run SECOND (after main schema). Idempotent-safe.
-- Dependencies: Requires main schema (20250114_initial_schema.sql) to be applied first
-- 
-- Security Enhancements:
-- - All auth.uid() calls optimized to (SELECT auth.uid()) for better performance
-- - Explicit TO authenticated clauses on all RLS policies
-- - Enhanced session validation and IP-based rate limiting
-- - Data integrity threat detection
-- - Comprehensive audit logging for compliance
-- - Compatible with existing TypeScript security layer (security.ts, breachDetection.ts)

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
    -- Get current user ID (optimized call)
    v_user_id := (SELECT auth.uid());

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
        (SELECT auth.uid()),
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
    WHERE id = (SELECT auth.uid());

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
    WHERE id = (SELECT auth.uid());

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
    v_user_id := (SELECT auth.uid());
    
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
    v_user_id := (SELECT auth.uid());
    
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
    v_user_id := (SELECT auth.uid());
    
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
-- ENHANCED SECURITY FUNCTIONS (moved earlier to satisfy dependency ordering)
-- ============================================
-- Additional security functions referenced by policies must be defined BEFORE policies & GRANTs

-- Validate session integrity and detect potential session hijacking
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_recent_logins INT;
    v_suspicious_patterns INT;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RETURN TRUE; -- RLS will block unauthenticated users where needed
    END IF;

    SELECT COUNT(*) INTO v_recent_logins
    FROM public.security_logs
    WHERE user_id = v_user_id
      AND action IN ('login', 'session_start')
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF v_recent_logins > 3 THEN
        PERFORM log_security_action('session_validation_failed',
            jsonb_build_object('reason', 'rapid_logins', 'count', v_recent_logins),
            false);
        RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO v_suspicious_patterns
    FROM public.security_logs
    WHERE user_id = v_user_id
      AND action = 'suspicious_activity_detected'
      AND created_at > NOW() - INTERVAL '1 hour';

    IF v_suspicious_patterns > 0 THEN
        PERFORM log_security_action('session_validation_failed',
            jsonb_build_object('reason', 'suspicious_activity', 'count', v_suspicious_patterns),
            false);
        RETURN FALSE;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM log_security_action('session_validation_error',
            jsonb_build_object('error', SQLERRM),
            false);
        RETURN TRUE; -- fail open
END;
$$;

-- Enhanced IP-based rate limiting
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
    p_action TEXT,
    p_ip_address INET DEFAULT NULL,
    p_limit_count INT DEFAULT 50,
    p_window_minutes INT DEFAULT 5
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
    v_user_id := (SELECT auth.uid());
    IF p_ip_address IS NULL OR v_user_id IS NULL THEN
        RETURN TRUE;
    END IF;

    SELECT COUNT(*) INTO v_request_count
    FROM public.security_logs
    WHERE ip_address = p_ip_address
      AND action = p_action
      AND created_at > NOW() - (p_window_minutes || ' minutes')::interval;

    IF v_request_count >= p_limit_count THEN
        PERFORM log_security_action('ip_rate_limit_exceeded',
            jsonb_build_object(
                'ip_address', p_ip_address::text,
                'action', p_action,
                'count', v_request_count,
                'limit', p_limit_count
            ),
            false);
        RETURN FALSE;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN TRUE;
END;
$$;

-- Detect & prevent rapid manipulation attempts
CREATE OR REPLACE FUNCTION public.check_data_integrity_threat(
    p_table_name TEXT,
    p_operation TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_operation_count INT;
    v_threat_threshold INT;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RETURN TRUE;
    END IF;

    v_threat_threshold := CASE p_operation
        WHEN 'DELETE' THEN 5
        WHEN 'UPDATE' THEN 20
        WHEN 'INSERT' THEN 50
        ELSE 10
    END;

    SELECT COUNT(*) INTO v_operation_count
    FROM public.security_logs
    WHERE user_id = v_user_id
      AND action LIKE '%' || lower(p_operation) || '%'
      AND details->>'table' = p_table_name
      AND created_at > NOW() - INTERVAL '1 minute';

    IF v_operation_count >= v_threat_threshold THEN
        PERFORM log_security_action('data_integrity_threat_detected',
            jsonb_build_object(
                'table_name', p_table_name,
                'operation', p_operation,
                'count', v_operation_count,
                'threshold', v_threat_threshold
            ),
            false);
        RETURN FALSE;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM log_security_action('data_integrity_check_error',
            jsonb_build_object('error', SQLERRM, 'table', p_table_name, 'operation', p_operation),
            false);
        RETURN TRUE;
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

-- Enhanced security functions
GRANT EXECUTE ON FUNCTION public.validate_session_security() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limit(TEXT, INET, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_data_integrity_threat(TEXT, TEXT) TO authenticated;

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
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    AND check_rate_limit('profile_read', 100, 1)
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND check_rate_limit('profile_create', 2, 60)
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    AND check_rate_limit('profile_update', 60, 1)
    AND validate_session_security()
    AND check_data_integrity_threat('profiles', 'UPDATE')
  )
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================
-- Subscriptions are read-only from client (managed by backend/webhooks)
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
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
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
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
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('progress_read', 100, 1)
  );

CREATE POLICY "course_progress_insert_own"
  ON public.course_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('progress_create', 50, 60)
    AND NOT EXISTS (
      SELECT 1 FROM public.course_progress cp
      WHERE cp.user_id = (SELECT auth.uid()) AND cp.course_id = course_id
    )
  );

CREATE POLICY "course_progress_update_own"
  ON public.course_progress
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('progress_update', 200, 1)
    AND validate_session_security()
  )
  WITH CHECK (user_id = (SELECT auth.uid()));

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
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('module_read', 200, 1)
  );

CREATE POLICY "module_progress_insert_own"
  ON public.module_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('module_create', 200, 60)
  );

CREATE POLICY "module_progress_update_own"
  ON public.module_progress
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('module_update', 200, 1)
  )
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- USER ACTIVITY TABLE POLICIES
-- ============================================
-- Users can only read their own activity logs (inserts handled by backend)
DROP POLICY IF EXISTS "user_activity_select_own" ON public.user_activity;

CREATE POLICY "user_activity_select_own"
  ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
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
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND check_rate_limit('security_log_read', 20, 1)
  );

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
-- Additional indexes to optimize common query patterns and security checks

-- Subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- Invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON public.invoices(user_id, date DESC);

-- Progress tracking queries
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON public.course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_course_module ON public.module_progress(user_id, course_id, module_id);

-- Enhanced security log indexes for faster threat detection
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_action_time ON public.security_logs(ip_address, action, created_at DESC) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_logs_suspicious_activity ON public.security_logs(user_id, created_at DESC) WHERE action = 'suspicious_activity_detected';
CREATE INDEX IF NOT EXISTS idx_security_logs_failed_actions ON public.security_logs(user_id, action, created_at DESC) WHERE success = false;

-- ============================================
-- TYPESCRIPT INTEGRATION HELPERS
-- ============================================
-- Functions to support existing TypeScript security layer

-- Get security metrics for the dashboard (supports existing security.ts)
CREATE OR REPLACE FUNCTION public.get_security_metrics(
    p_time_window_hours INT DEFAULT 24
)
RETURNS TABLE (
    total_events BIGINT,
    failed_events BIGINT,
    unique_users BIGINT,
    unique_ips BIGINT,
    top_failed_actions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE success = false) as failed_events,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) as unique_ips
        FROM public.security_logs
        WHERE created_at > NOW() - (p_time_window_hours || ' hours')::interval
    ),
    failed_actions AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'action', action,
                'count', action_count
            ) ORDER BY action_count DESC
        ) as top_failed
        FROM (
            SELECT action, COUNT(*) as action_count
            FROM public.security_logs
            WHERE success = false
              AND created_at > NOW() - (p_time_window_hours || ' hours')::interval
            GROUP BY action
            ORDER BY action_count DESC
            LIMIT 10
        ) fa
    )
    SELECT 
        m.total_events,
        m.failed_events,
        m.unique_users,
        m.unique_ips,
        COALESCE(fa.top_failed, '[]'::jsonb)
    FROM metrics m
    CROSS JOIN failed_actions fa;
END;
$$;

-- Check if user has any active security alerts (supports existing breachDetection.ts)
CREATE OR REPLACE FUNCTION public.get_user_security_alerts()
RETURNS TABLE (
    alert_type TEXT,
    alert_count BIGINT,
    last_occurrence TIMESTAMPTZ,
    severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH alert_data AS (
        SELECT 
            CASE 
                WHEN action = 'rate_limit_exceeded' THEN 'Rate Limit Violation'
                WHEN action = 'suspicious_activity_detected' THEN 'Suspicious Activity'
                WHEN action = 'fraud_signal_detected' THEN 'Fraud Alert'
                WHEN action = 'session_validation_failed' THEN 'Session Security'
                WHEN action = 'data_integrity_threat_detected' THEN 'Data Integrity'
                ELSE 'Security Alert'
            END as alert_type,
            COUNT(*) as alert_count,
            MAX(created_at) as last_occurrence,
            CASE 
                WHEN action = 'fraud_signal_detected' THEN 'HIGH'
                WHEN action = 'data_integrity_threat_detected' THEN 'HIGH'
                WHEN action = 'suspicious_activity_detected' THEN 'MEDIUM'
                ELSE 'LOW'
            END as severity
        FROM public.security_logs
        WHERE user_id = v_user_id
          AND success = false
          AND created_at > NOW() - INTERVAL '7 days'
          AND action IN (
              'rate_limit_exceeded', 
              'suspicious_activity_detected', 
              'fraud_signal_detected',
              'session_validation_failed',
              'data_integrity_threat_detected'
          )
        GROUP BY action
    )
    SELECT 
        ad.alert_type,
        ad.alert_count,
        ad.last_occurrence,
        ad.severity
    FROM alert_data ad
    ORDER BY 
        CASE ad.severity
            WHEN 'HIGH' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'LOW' THEN 3
        END,
        ad.last_occurrence DESC;
END;
$$;

-- Grant permissions for integration functions
GRANT EXECUTE ON FUNCTION public.get_security_metrics(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_security_alerts() TO authenticated;

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
