-- ============================================================================
-- Supabase SQL schema for DISCOVER 50 AI
-- Version: 2.0.0
-- Description: Base schema with enhanced RLS compatibility and performance optimizations
-- Run FIRST in the Supabase SQL Editor (fully idempotent)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- PROFILES TABLE
-- =========================
-- Extended user profiles with security tracking and verification status
CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text NOT NULL,
  name             text,
  tier             text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','advanced','expert')),
  verified         boolean NOT NULL DEFAULT false,
  join_date        timestamptz NOT NULL DEFAULT now(),
  last_login_at    timestamptz,
  login_attempts   integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for migration compatibility)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Public profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create optimized RLS policies using (select auth.uid()) for performance
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles (tier) WHERE tier != 'free';
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles (verified) WHERE verified = true;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SUBSCRIPTIONS TABLE
-- =========================
-- Subscription management with billing cycles and grace periods
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id              text NOT NULL CHECK (plan_id IN ('free','advanced','expert')),
  status               text NOT NULL CHECK (status IN ('active','cancelled','expired','trial','grace_period')),
  start_date           timestamptz NOT NULL DEFAULT now(),
  end_date             timestamptz,
  next_billing_date    timestamptz,
  trial_end_date       timestamptz,
  grace_period_end     timestamptz,
  payment_brand        text,
  payment_last4        text,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  auto_renew           boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for migration compatibility)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users access their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;

-- Create optimized RLS policies (will be enhanced by migration)
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "subscriptions_insert_own"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "subscriptions_update_own"
  ON public.subscriptions
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON public.subscriptions (plan_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_date ON public.subscriptions (next_billing_date) 
  WHERE status = 'active' AND next_billing_date IS NOT NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- INVOICES TABLE
-- =========================
-- Billing history with status tracking
CREATE TABLE IF NOT EXISTS public.invoices (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         timestamptz NOT NULL DEFAULT now(),
  amount       numeric NOT NULL,
  plan_name    text NOT NULL,
  status       text NOT NULL,
  download_url text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for migration compatibility)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Update status constraint to include all possible values
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('paid','pending','failed','disputed','refunded'));

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users access their invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_system" ON public.invoices;

-- Create optimized RLS policies
CREATE POLICY "invoices_select_own"
  ON public.invoices
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Only system can insert invoices (through service role)
CREATE POLICY "invoices_insert_system"
  ON public.invoices
  FOR INSERT
  WITH CHECK (false);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON public.invoices (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices (user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status) WHERE status IN ('pending', 'disputed');

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- COURSE PROGRESS TABLE
-- =========================
-- Overall course tracking with completion status
CREATE TABLE IF NOT EXISTS public.course_progress (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id             text NOT NULL,
  started_at            timestamptz NOT NULL DEFAULT now(),
  last_accessed_at      timestamptz NOT NULL DEFAULT now(),
  completed_modules     text[] NOT NULL DEFAULT '{}',
  current_module_id     text,
  total_time_spent      integer NOT NULL DEFAULT 0,
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  completed             boolean NOT NULL DEFAULT false,
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Add columns if they don't exist (for migration compatibility)
ALTER TABLE public.course_progress
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add unique constraint if not exists
ALTER TABLE public.course_progress
  DROP CONSTRAINT IF EXISTS course_progress_user_course_unique;
ALTER TABLE public.course_progress
  ADD CONSTRAINT course_progress_user_course_unique UNIQUE (user_id, course_id);

-- Enable RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users access their course progress" ON public.course_progress;
DROP POLICY IF EXISTS "course_progress_select_own" ON public.course_progress;
DROP POLICY IF EXISTS "course_progress_insert_own" ON public.course_progress;
DROP POLICY IF EXISTS "course_progress_update_own" ON public.course_progress;

-- Create optimized RLS policies
CREATE POLICY "course_progress_select_own"
  ON public.course_progress
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "course_progress_insert_own"
  ON public.course_progress
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "course_progress_update_own"
  ON public.course_progress
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course
  ON public.course_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_completed
  ON public.course_progress (user_id, completed);
CREATE INDEX IF NOT EXISTS idx_course_progress_last_accessed
  ON public.course_progress (user_id, last_accessed_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_course_progress_updated_at ON public.course_progress;
CREATE TRIGGER update_course_progress_updated_at
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- MODULE PROGRESS TABLE
-- =========================
-- Individual module completion data with rating and notes
CREATE TABLE IF NOT EXISTS public.module_progress (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    text NOT NULL,
  course_id    text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  time_spent   integer NOT NULL DEFAULT 0 CHECK (time_spent >= 0),
  rating       integer CHECK (rating >= 1 AND rating <= 5),
  attempts     integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, module_id)
);

-- Add columns if they don't exist (for migration compatibility)
ALTER TABLE public.module_progress
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add unique constraint if not exists
ALTER TABLE public.module_progress
  DROP CONSTRAINT IF EXISTS module_progress_user_course_module_unique;
ALTER TABLE public.module_progress
  ADD CONSTRAINT module_progress_user_course_module_unique UNIQUE (user_id, course_id, module_id);

-- Enable RLS
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users access their module progress" ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_select_own" ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_insert_own" ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_update_own" ON public.module_progress;

-- Create optimized RLS policies
CREATE POLICY "module_progress_select_own"
  ON public.module_progress
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "module_progress_insert_own"
  ON public.module_progress
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "module_progress_update_own"
  ON public.module_progress
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_module_progress_user_course_module
  ON public.module_progress (user_id, course_id, module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_completed
  ON public.module_progress (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_progress_rating
  ON public.module_progress (rating) WHERE rating IS NOT NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_module_progress_updated_at ON public.module_progress;
CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- USER ACTIVITY TABLE
-- =========================
-- Activity logging for analytics and user journey tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  description text,
  timestamp   timestamptz NOT NULL DEFAULT now(),
  course_id   text,
  module_id   text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Add column if it doesn't exist (for migration compatibility)
ALTER TABLE public.user_activity
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users access their activity" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_select_own" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_insert_own" ON public.user_activity;

-- Create optimized RLS policies (read and append only, no updates)
CREATE POLICY "user_activity_select_own"
  ON public.user_activity
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "user_activity_insert_own"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_timestamp ON public.user_activity (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity (type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_course ON public.user_activity (course_id, timestamp DESC) 
  WHERE course_id IS NOT NULL;

-- =========================
-- ADDITIONAL FUNCTIONS
-- =========================

-- Function to safely get user tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_uuid uuid)
RETURNS text AS $$
DECLARE
  user_tier text;
BEGIN
  SELECT tier INTO user_tier 
  FROM public.profiles 
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, required_tier text)
RETURNS boolean AS $$
DECLARE
  active_sub boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriptions 
    WHERE user_id = user_uuid 
      AND status = 'active'
      AND plan_id = required_tier
      AND (end_date IS NULL OR end_date > now())
  ) INTO active_sub;
  
  RETURN active_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =========================

-- Profile lookups by email with tier
CREATE INDEX IF NOT EXISTS idx_profiles_email_tier ON public.profiles (email, tier);

-- Active subscriptions by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_users ON public.subscriptions (user_id, status, plan_id) 
  WHERE status = 'active';

-- Recent activity by user (removed WHERE clause due to immutability requirement)
CREATE INDEX IF NOT EXISTS idx_user_activity_recent ON public.user_activity (user_id, timestamp DESC);

-- =========================
-- MIGRATION NOTICE
-- =========================
-- This schema is designed to be idempotent and can be run multiple times safely.
-- After running this base schema, apply any additional migrations in sequence.
-- All tables include created_at/updated_at columns for audit purposes.
-- RLS policies use (select auth.uid()) for optimal performance per Supabase best practices.
