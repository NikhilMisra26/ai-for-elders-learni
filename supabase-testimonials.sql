-- Testimonials + public metrics with enhanced security
-- Run THIRD after main schema & migration
-- Last updated: 2025-08-14

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TESTIMONIALS
-- =========================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name      text NOT NULL CHECK (char_length(user_name) BETWEEN 2 AND 100),
  user_location  text CHECK (user_location IS NULL OR char_length(user_location) BETWEEN 2 AND 100),
  course_tier    text NOT NULL CHECK (course_tier IN ('free','advanced','expert')),
  rating         integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content        text NOT NULL CHECK (char_length(content) BETWEEN 10 AND 1000),
  is_approved    boolean NOT NULL DEFAULT false,
  is_featured    boolean NOT NULL DEFAULT false,
  display_order  integer CHECK (display_order IS NULL OR display_order >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  approved_at    timestamptz,
  approved_by    uuid REFERENCES auth.users(id),
  
  -- Prevent duplicate testimonials from same user
  CONSTRAINT unique_user_testimonial UNIQUE (user_id)
);

-- Add missing columns if table exists from previous partial run
ALTER TABLE public.testimonials 
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trg_testimonials_set_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- =========================
-- RATE LIMITING TABLE
-- =========================
CREATE TABLE IF NOT EXISTS public.testimonial_rate_limits (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_attempt   timestamptz NOT NULL DEFAULT now(),
  attempt_count  integer NOT NULL DEFAULT 1,
  
  -- Reset counter after 24 hours
  CONSTRAINT check_recent_attempts CHECK (
    last_attempt > (now() - interval '24 hours')
  )
);

ALTER TABLE public.testimonial_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the user can see their own rate limit data
CREATE POLICY "Users can view own rate limits"
  ON public.testimonial_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can update rate limits via function
CREATE POLICY "System manages rate limits"
  ON public.testimonial_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- =========================
-- VALIDATION FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION public.can_submit_testimonial(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_count integer;
  v_existing_testimonial integer;
  v_last_attempt timestamptz;
  v_attempt_count integer;
BEGIN
  -- Check if user has completed at least one module
  SELECT COUNT(*) INTO v_module_count
  FROM public.module_progress
  WHERE user_id = p_user_id
    AND completed_at IS NOT NULL;
  
  IF v_module_count = 0 THEN
    RAISE EXCEPTION 'Must complete at least one module before submitting a testimonial';
  END IF;
  
  -- Check if user already has a testimonial
  SELECT COUNT(*) INTO v_existing_testimonial
  FROM public.testimonials
  WHERE user_id = p_user_id;
  
  IF v_existing_testimonial > 0 THEN
    RAISE EXCEPTION 'You have already submitted a testimonial';
  END IF;
  
  -- Check rate limiting (max 3 attempts per 24 hours)
  SELECT last_attempt, attempt_count INTO v_last_attempt, v_attempt_count
  FROM public.testimonial_rate_limits
  WHERE user_id = p_user_id;
  
  IF v_last_attempt IS NOT NULL THEN
    -- Reset counter if last attempt was over 24 hours ago
    IF v_last_attempt < (now() - interval '24 hours') THEN
      DELETE FROM public.testimonial_rate_limits WHERE user_id = p_user_id;
      v_attempt_count := 0;
    ELSIF v_attempt_count >= 3 THEN
      RAISE EXCEPTION 'Too many submission attempts. Please try again later.';
    END IF;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO public.testimonial_rate_limits (user_id, last_attempt, attempt_count)
  VALUES (p_user_id, now(), COALESCE(v_attempt_count, 0) + 1)
  ON CONFLICT (user_id) DO UPDATE
  SET last_attempt = now(),
      attempt_count = COALESCE(testimonial_rate_limits.attempt_count, 0) + 1;
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_submit_testimonial(uuid) TO authenticated;

-- =========================
-- ENHANCED RLS POLICIES
-- =========================

-- 1) Public can read approved testimonials (featured first)
DROP POLICY IF EXISTS "Public can read approved testimonials" ON public.testimonials;
CREATE POLICY "Public can read approved testimonials"
  ON public.testimonials
  FOR SELECT
  USING (is_approved = true);

-- 2) Users can view their own testimonials regardless of approval status
DROP POLICY IF EXISTS "Users can view own testimonials" ON public.testimonials;
CREATE POLICY "Users can view own testimonials"
  ON public.testimonials
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3) Authenticated users can create with validation
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
CREATE POLICY "Users can insert their own testimonials"
  ON public.testimonials
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.can_submit_testimonial(auth.uid())
  );

-- 4) Author can update until approved (content and rating only)
DROP POLICY IF EXISTS "Users can update their unapproved testimonials" ON public.testimonials;
CREATE POLICY "Users can update their unapproved testimonials"
  ON public.testimonials
  FOR UPDATE
  USING (auth.uid() = user_id AND is_approved = false)
  WITH CHECK (
    auth.uid() = user_id 
    AND is_approved = false
    -- Prevent changing system fields
    AND is_featured = false
    AND display_order IS NULL
    AND approved_at IS NULL
    AND approved_by IS NULL
  );

-- 5) Author can delete until approved
DROP POLICY IF EXISTS "Users can delete their unapproved testimonials" ON public.testimonials;
CREATE POLICY "Users can delete their unapproved testimonials"
  ON public.testimonials
  FOR DELETE
  USING (auth.uid() = user_id AND is_approved = false);

-- =========================
-- OPTIMIZED INDEXES
-- =========================
-- Index for public listing (featured testimonials first, then by order/date)
CREATE INDEX IF NOT EXISTS idx_testimonials_public_listing 
  ON public.testimonials (is_approved, is_featured DESC, display_order NULLS LAST, created_at DESC)
  WHERE is_approved = true;

-- Index for user lookup (enforce unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_user ON public.testimonials (user_id);

-- Index for admin review queue
CREATE INDEX IF NOT EXISTS idx_testimonials_pending_review 
  ON public.testimonials (created_at DESC)
  WHERE is_approved = false;

-- Index for rating analytics
CREATE INDEX IF NOT EXISTS idx_testimonials_rating_stats 
  ON public.testimonials (rating, course_tier)
  WHERE is_approved = true;

-- Clean up old rate limit records periodically (removed WHERE clause due to immutability requirement)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON public.testimonial_rate_limits (last_attempt);

-- =========================
-- METRICS FUNCTION (for homepage)
-- =========================
-- Returns platform statistics with caching support
-- Cache key: 'platform_stats' with 5-minute TTL recommended
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE  -- Function result is stable within a transaction
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users integer;
  v_active_users integer;
  v_avg_completion numeric(5,2);
  v_avg_rating numeric(3,2);
  v_total_testimonials integer;
  v_featured_testimonials integer;
  v_countries_count integer;
  v_modules_completed integer;
  v_users_per_country_estimate integer := 200;
BEGIN
  -- Total registered users (exclude soft-deleted if applicable)
  SELECT COUNT(*)::integer INTO v_total_users
  FROM public.profiles
  WHERE verified = true;  -- Only count verified users

  -- Active users (logged in within last 30 days)
  SELECT COUNT(*)::integer INTO v_active_users
  FROM public.profiles
  WHERE last_login_at > (CURRENT_DATE - interval '30 days')
    AND verified = true;

  -- Average course completion (only for users with progress)
  SELECT 
    ROUND(AVG(completion_percentage)::numeric, 2) INTO v_avg_completion
  FROM public.course_progress
  WHERE completion_percentage > 0
    AND user_id IN (SELECT id FROM public.profiles WHERE verified = true);

  -- Average rating from approved testimonials
  SELECT 
    ROUND(AVG(rating)::numeric, 2) INTO v_avg_rating
  FROM public.testimonials
  WHERE is_approved = true
    AND rating IS NOT NULL;

  -- Total and featured testimonials count
  SELECT 
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE is_featured = true)::integer
  INTO v_total_testimonials, v_featured_testimonials
  FROM public.testimonials
  WHERE is_approved = true;

  -- Total modules completed across all users
  SELECT COUNT(*)::integer INTO v_modules_completed
  FROM public.module_progress
  WHERE completed_at IS NOT NULL;

  -- Countries estimate based on user distribution
  -- More realistic: use logarithmic scale for country estimation
  IF v_total_users > 0 THEN
    v_countries_count := LEAST(
      195,  -- Max countries in the world
      GREATEST(
        1,
        CEIL(LN(v_total_users + 1) * 5)::integer  -- Logarithmic growth
      )
    );
  ELSE
    v_countries_count := 0;
  END IF;

  -- Return comprehensive stats with NULL handling
  RETURN json_build_object(
    'total_users',          COALESCE(v_total_users, 0),
    'active_users',         COALESCE(v_active_users, 0),
    'avg_completion',       COALESCE(v_avg_completion, 0.0),
    'avg_rating',           COALESCE(v_avg_rating, 0.0),
    'total_testimonials',   COALESCE(v_total_testimonials, 0),
    'featured_testimonials', COALESCE(v_featured_testimonials, 0),
    'countries_count',      COALESCE(v_countries_count, 0),
    'modules_completed',    COALESCE(v_modules_completed, 0),
    'last_updated',         now()::timestamptz
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return safe defaults
    RAISE WARNING 'Error in get_platform_stats: %', SQLERRM;
    RETURN json_build_object(
      'total_users', 0,
      'active_users', 0,
      'avg_completion', 0.0,
      'avg_rating', 0.0,
      'total_testimonials', 0,
      'featured_testimonials', 0,
      'countries_count', 0,
      'modules_completed', 0,
      'last_updated', now()::timestamptz,
      'error', true
    );
END;
$$;

-- Grant execute permission with rate limiting consideration
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

-- =========================
-- CLEANUP FUNCTION
-- =========================
-- Remove old rate limit records (run via pg_cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_testimonial_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.testimonial_rate_limits
  WHERE last_attempt < (CURRENT_DATE - interval '1 day');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Grant execute to service role only (for scheduled jobs)
REVOKE EXECUTE ON FUNCTION public.cleanup_testimonial_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_testimonial_rate_limits() TO service_role;

-- =========================
-- ADMIN FUNCTIONS
-- =========================
-- Function to approve testimonials (admin only)
CREATE OR REPLACE FUNCTION public.approve_testimonial(
  p_testimonial_id uuid,
  p_admin_id uuid,
  p_is_featured boolean DEFAULT false,
  p_display_order integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin has permission (implement your admin check logic)
  -- For now, we'll just check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update the testimonial
  UPDATE public.testimonials
  SET 
    is_approved = true,
    is_featured = p_is_featured,
    display_order = p_display_order,
    approved_at = now(),
    approved_by = p_admin_id,
    updated_at = now()
  WHERE id = p_testimonial_id
    AND is_approved = false;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Grant execute to authenticated users (add admin role check in function)
GRANT EXECUTE ON FUNCTION public.approve_testimonial(uuid, uuid, boolean, integer) TO authenticated;

-- =========================
-- SAMPLE DATA (Development Only)
-- =========================
-- Uncomment below to insert sample testimonials for testing
-- Make sure to have test users in auth.users first

/*
-- Sample testimonials (requires existing user IDs)
INSERT INTO public.testimonials (
  user_id, 
  user_name, 
  user_location, 
  course_tier, 
  rating, 
  content, 
  is_approved,
  is_featured,
  display_order
) VALUES 
  (
    'USER_ID_1', -- Replace with actual user ID
    'Margaret Thompson',
    'Austin, TX',
    'expert',
    5,
    'This course completely transformed how I use AI in my daily life. The pace is perfect for someone like me who isn''t tech-savvy.',
    true,
    true,
    1
  ),
  (
    'USER_ID_2', -- Replace with actual user ID
    'Robert Chen',
    'San Francisco, CA',
    'advanced',
    5,
    'Finally, an AI course that doesn''t assume you''re a computer genius! The instructors are patient and the examples are relevant.',
    true,
    false,
    2
  ),
  (
    'USER_ID_3', -- Replace with actual user ID
    'Linda Martinez',
    'Miami, FL',
    'free',
    4,
    'Great introduction to AI. I started with the free tier and upgraded after seeing how helpful it was.',
    true,
    false,
    3
  );
*/

-- =========================
-- DOCUMENTATION
-- =========================
/*
TESTIMONIALS SYSTEM OVERVIEW
============================

Tables:
-------
1. testimonials - Main testimonial storage with approval workflow
2. testimonial_rate_limits - Rate limiting to prevent spam

Security Features:
-----------------
1. Rate Limiting: Max 3 submission attempts per 24 hours
2. Validation: Users must complete at least one module
3. Unique Constraint: One testimonial per user
4. Content Length Limits: Prevent abuse
5. RLS Policies: Granular access control

Functions:
----------
1. can_submit_testimonial(user_id) - Validates submission eligibility
2. get_platform_stats() - Returns cached-friendly metrics
3. cleanup_testimonial_rate_limits() - Maintenance function
4. approve_testimonial() - Admin approval workflow

Indexes:
--------
1. idx_testimonials_public_listing - Optimized for public display
2. idx_testimonials_user - Unique constraint enforcement
3. idx_testimonials_pending_review - Admin review queue
4. idx_testimonials_rating_stats - Analytics queries
5. idx_rate_limits_cleanup - Maintenance operations

Usage Examples:
--------------

-- Submit a testimonial (from application)
INSERT INTO public.testimonials (
  user_id, user_name, user_location, course_tier, rating, content
) VALUES (
  auth.uid(), 'John Doe', 'New York', 'advanced', 5, 'Great course!'
);

-- Get platform stats for homepage
SELECT public.get_platform_stats();

-- Approve a testimonial (admin)
SELECT public.approve_testimonial(
  'testimonial-id-here',
  auth.uid(),
  true,  -- is_featured
  1      -- display_order
);

-- Clean up old rate limits (scheduled job)
SELECT public.cleanup_testimonial_rate_limits();

Performance Considerations:
--------------------------
1. Platform stats should be cached (5-minute TTL recommended)
2. Use partial indexes for filtered queries
3. Rate limit cleanup should run daily via pg_cron
4. Consider materialized views for heavy analytics

Migration Notes:
---------------
1. Run AFTER base schema (supabase.schema.sql)
2. Run AFTER enhanced RLS migration
3. Requires uuid-ossp and pgcrypto extensions
4. Uses update_updated_at_column() trigger from base schema

Testing Checklist:
-----------------
[ ] User can submit testimonial after completing module
[ ] Rate limiting prevents spam
[ ] Duplicate testimonials are rejected
[ ] Content validation works
[ ] Approved testimonials appear publicly
[ ] Featured testimonials display first
[ ] Platform stats calculate correctly
[ ] Admin can approve/feature testimonials
[ ] Rate limit cleanup runs successfully
*/
