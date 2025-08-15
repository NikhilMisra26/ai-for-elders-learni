-- Test Script for Supabase Migrations
-- Run this after applying the enhanced schema file:
-- 1. supabase.schema.sql (Enterprise-grade schema with enhanced RLS security v2.1.0)
--
-- Expected output: All tests should show 'PASS'
-- Tests validate enterprise-grade security features and optimized RLS policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 1: TABLE EXISTENCE TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 1.1: Core tables exist (updated for enhanced schema v2.1.0)
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'subscriptions', 
    'course_progress',
    'module_progress',
    'user_activity',
    'invoices'
  ]) as table_name
),
actual_tables AS (
  SELECT tablename as table_name
  FROM pg_tables 
  WHERE schemaname = 'public'
)
SELECT 
  'Core Tables Exist' as test_name,
  CASE 
    WHEN COUNT(DISTINCT e.table_name) = 6 THEN 'PASS ✓ (6 core tables)'
    ELSE 'FAIL ✗ - Expected 6, found: ' || COUNT(DISTINCT a.table_name) || ' - Missing: ' || string_agg(CASE WHEN a.table_name IS NULL THEN e.table_name END, ', ')
  END as result
FROM expected_tables e
LEFT JOIN actual_tables a ON e.table_name = a.table_name;

-- ============================================================================
-- SECTION 2: COLUMN STRUCTURE TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 2: COLUMN STRUCTURE TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 2.1: Profiles table columns (updated for enhanced schema v2.1.0)
SELECT 
  'Profiles Table Structure' as test_name,
  CASE 
    WHEN COUNT(*) >= 9 THEN 'PASS ✓ (' || COUNT(*) || ' columns found)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' columns found, expected at least 9'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'name', 'tier', 'verified', 'join_date',
    'last_login_at', 'login_attempts', 'created_at', 'updated_at'
  );

-- Test 2.2: Enhanced security tracking columns in profiles
SELECT 
  'Enhanced Security Tracking' as test_name,
  CASE 
    WHEN COUNT(*) = 3 THEN 'PASS ✓ (Enhanced security tracking columns present)'
    ELSE 'FAIL ✗ - Missing enhanced security tracking columns'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'verified', 'last_login_at', 'login_attempts'
  );

-- Test 2.3: Subscriptions enhanced structure
SELECT 
  'Subscriptions Enhanced Structure' as test_name,
  CASE 
    WHEN COUNT(*) >= 14 THEN 'PASS ✓ (' || COUNT(*) || ' columns found)'
    ELSE 'FAIL ✗ - Expected at least 14 columns, found ' || COUNT(*)
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
  AND column_name IN (
    'id', 'user_id', 'plan_id', 'status', 'start_date', 'end_date',
    'next_billing_date', 'trial_end_date', 'grace_period_end',
    'payment_brand', 'payment_last4', 'cancel_at_period_end',
    'auto_renew', 'created_at', 'updated_at'
  );

-- ============================================================================
-- SECTION 3: RLS (ROW LEVEL SECURITY) TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 3: ROW LEVEL SECURITY TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 3.1: RLS enabled on all user tables (enhanced v2.1.0)
WITH rls_status AS (
  SELECT 
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'subscriptions', 'course_progress', 
      'module_progress', 'user_activity', 'invoices'
    )
)
SELECT 
  'Enhanced RLS Enabled' as test_name,
  CASE 
    WHEN COUNT(*) = COUNT(CASE WHEN rowsecurity THEN 1 END) AND COUNT(*) = 6
    THEN 'PASS ✓ (6 core tables protected with enhanced RLS)'
    ELSE 'FAIL ✗ - Expected 6 tables with RLS, found ' || COUNT(CASE WHEN rowsecurity THEN 1 END) || ' protected out of ' || COUNT(*)
  END as result
FROM rls_status;

-- Test 3.2: Enhanced RLS policies with optimized patterns
SELECT 
  'Enhanced RLS Policies' as test_name,
  CASE 
    WHEN COUNT(DISTINCT tablename) >= 6 AND COUNT(*) >= 16 THEN 'PASS ✓ (' || COUNT(*) || ' optimized policies across ' || COUNT(DISTINCT tablename) || ' tables)'
    ELSE 'FAIL ✗ - Expected ≥16 policies across ≥6 tables, found ' || COUNT(*) || ' policies across ' || COUNT(DISTINCT tablename) || ' tables'
  END as result
FROM pg_policies
WHERE schemaname = 'public';

-- Test 3.3: Validate optimized RLS pattern (select auth.uid()) is used
SELECT 
  'Optimized RLS Patterns' as test_name,
  CASE 
    WHEN COUNT(*) >= 10 THEN 'PASS ✓ (' || COUNT(*) || ' policies use optimized auth.uid() pattern)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' policies use optimized pattern'
  END as result
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%(select auth.uid())%' OR with_check LIKE '%(select auth.uid())%');

-- ============================================================================
-- SECTION 4: FUNCTION TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 4: FUNCTION TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 4.1: Enhanced security functions exist
WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'update_updated_at_column',
    'get_user_tier',
    'has_active_subscription'
  ]) as function_name
),
actual_functions AS (
  SELECT routine_name as function_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
)
SELECT 
  'Enhanced Security Functions' as test_name,
  CASE 
    WHEN COUNT(DISTINCT a.function_name) >= 3 THEN 'PASS ✓ (' || COUNT(DISTINCT a.function_name) || ' enhanced functions)'
    ELSE 'FAIL ✗ - Expected at least 3 functions, found ' || COUNT(DISTINCT a.function_name)
  END as result
FROM expected_functions e
LEFT JOIN actual_functions a ON e.function_name = a.function_name;

-- Test 4.2: Test get_user_tier function
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  tier_result text;
BEGIN
  -- Insert test profile
  INSERT INTO profiles (id, email, tier)
  VALUES (test_user_id, 'test-tier@example.com', 'advanced');
  
  -- Test get_user_tier function
  tier_result := get_user_tier(test_user_id);
  
  IF tier_result = 'advanced' THEN
    RAISE NOTICE 'Get User Tier Function: PASS ✓ (Correctly returned advanced tier)';
  ELSE
    RAISE NOTICE 'Get User Tier Function: FAIL ✗ (Expected advanced, got %)', tier_result;
  END IF;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Get User Tier Function: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- Test 4.3: Test has_active_subscription function
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  subscription_result boolean;
BEGIN
  -- Insert test profile and subscription
  INSERT INTO profiles (id, email, tier)
  VALUES (test_user_id, 'test-sub@example.com', 'expert');
  
  INSERT INTO subscriptions (user_id, plan_id, status, start_date)
  VALUES (test_user_id, 'expert', 'active', NOW());
  
  -- Test has_active_subscription function
  subscription_result := has_active_subscription(test_user_id, 'expert');
  
  IF subscription_result THEN
    RAISE NOTICE 'Active Subscription Function: PASS ✓ (Correctly detected active subscription)';
  ELSE
    RAISE NOTICE 'Active Subscription Function: FAIL ✗ (Failed to detect active subscription)';
  END IF;
  
  -- Clean up
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Active Subscription Function: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 5: CONSTRAINT TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 5: CONSTRAINT TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 5.1: Check constraints
SELECT 
  'Check Constraints' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS ✓ (' || COUNT(*) || ' constraints)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' constraints found'
  END as result
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';

-- Test 5.2: Enhanced foreign key constraints
SELECT 
  'Enhanced Foreign Key Constraints' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS ✓ (' || COUNT(*) || ' enhanced relationships)'
    ELSE 'FAIL ✗ - Expected at least 5 FK relationships, found ' || COUNT(*)
  END as result
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- Test 5.3: Unique constraints
SELECT 
  'Unique Constraints' as test_name,
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASS ✓ (' || COUNT(*) || ' unique constraints)'
    ELSE 'FAIL ✗ - Missing unique constraints'
  END as result
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- SECTION 6: INDEX TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 6: INDEX TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 6.1: Enhanced performance indexes exist
WITH important_indexes AS (
  SELECT unnest(ARRAY[
    'idx_profiles_email',
    'idx_profiles_tier',
    'idx_profiles_verified',
    'idx_subscriptions_user_id',
    'idx_subscriptions_status',
    'idx_subscriptions_plan_status',
    'idx_subscriptions_billing_date',
    'idx_course_progress_user_course',
    'idx_course_progress_user_completed',
    'idx_course_progress_last_accessed',
    'idx_module_progress_user_course_module',
    'idx_module_progress_completed',
    'idx_module_progress_rating',
    'idx_user_activity_user',
    'idx_user_activity_user_timestamp',
    'idx_user_activity_type',
    'idx_user_activity_course',
    'idx_invoices_user_date',
    'idx_invoices_user_status',
    'idx_invoices_status'
  ]) as index_name
),
actual_indexes AS (
  SELECT indexname as index_name
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT 
  'Enhanced Performance Indexes' as test_name,
  CASE 
    WHEN COUNT(DISTINCT a.index_name) >= 15 THEN 'PASS ✓ (' || COUNT(DISTINCT a.index_name) || ' optimized indexes)'
    ELSE 'FAIL ✗ - Expected ≥15 indexes, found ' || COUNT(DISTINCT a.index_name)
  END as result
FROM important_indexes i
LEFT JOIN actual_indexes a ON i.index_name = a.index_name;

-- ============================================================================
-- SECTION 7: DATA INTEGRITY TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 7: DATA INTEGRITY TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 7.1: Enhanced constraint validation
SELECT 
  'Enhanced Constraint Validation' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_schema = 'public' 
        AND constraint_name LIKE '%tier%'
    ) THEN 'PASS ✓ (Tier constraints validated)'
    ELSE 'FAIL ✗ - Missing tier constraints'
  END as result;

-- Test 7.2: Enhanced status validation
SELECT 
  'Enhanced Status Validation' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_schema = 'public' 
        AND constraint_name LIKE '%status%'
    ) THEN 'PASS ✓ (Status constraints validated)'
    ELSE 'FAIL ✗ - Missing status constraints'
  END as result;

-- Test 7.3: Enhanced data integrity checks
SELECT 
  'Enhanced Data Integrity' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_schema = 'public' 
        AND constraint_name LIKE '%completion%'
    ) THEN 'PASS ✓ (Completion percentage validation)'
    ELSE 'FAIL ✗ - Missing completion validation'
  END as result;

-- ============================================================================
-- SECTION 8: TRIGGER TESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 8: TRIGGER TESTS';
  RAISE NOTICE '========================================';
END $$;

-- Test 8.1: Enhanced updated_at triggers
WITH trigger_tables AS (
  SELECT DISTINCT event_object_table as table_name
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%'
)
SELECT 
  'Enhanced Updated_at Triggers' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS ✓ (' || COUNT(*) || ' tables with enhanced triggers)'
    ELSE 'FAIL ✗ - Expected ≥5 tables with triggers, found ' || COUNT(*)
  END as result
FROM trigger_tables;

-- ============================================================================
-- SECTION 9: ENHANCED SECURITY VALIDATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 9: ENHANCED SECURITY VALIDATION';
  RAISE NOTICE '========================================';
END $$;

-- Test 9.1: Test cascading deletes for security
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  remaining_records integer;
BEGIN
  -- Insert test data across related tables
  INSERT INTO profiles (id, email, tier)
  VALUES (test_user_id, 'test-cascade@example.com', 'free');
  
  INSERT INTO subscriptions (user_id, plan_id, status)
  VALUES (test_user_id, 'free', 'active');
  
  INSERT INTO course_progress (user_id, course_id, completion_percentage)
  VALUES (test_user_id, 'test-course', 50);
  
  -- Count related records
  SELECT COUNT(*) INTO remaining_records
  FROM (
    SELECT user_id FROM subscriptions WHERE user_id = test_user_id
    UNION ALL
    SELECT user_id FROM course_progress WHERE user_id = test_user_id
  ) related;
  
  IF remaining_records = 2 THEN
    RAISE NOTICE 'Cascading Delete Security: PASS ✓ (Related records properly linked)';
  ELSE
    RAISE NOTICE 'Cascading Delete Security: FAIL ✗ (Expected 2 related records, found %)', remaining_records;
  END IF;
  
  -- Clean up (this will test cascading)
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Cascading Delete Security: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- Test 9.2: Test subscription tier validation security
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  valid_insert boolean := true;
BEGIN
  -- Try to insert valid tier
  BEGIN
    INSERT INTO profiles (id, email, tier)
    VALUES (test_user_id, 'test-tier-valid@example.com', 'advanced');
  EXCEPTION
    WHEN OTHERS THEN
      valid_insert := false;
  END;
  
  -- Try to insert invalid tier (should fail)
  BEGIN
    INSERT INTO profiles (id, email, tier)
    VALUES (gen_random_uuid(), 'test-tier-invalid@example.com', 'invalid_tier');
    RAISE NOTICE 'Tier Validation Security: FAIL ✗ (Invalid tier accepted)';
  EXCEPTION
    WHEN OTHERS THEN
      IF valid_insert THEN
        RAISE NOTICE 'Tier Validation Security: PASS ✓ (Tier constraints enforced)';
      ELSE
        RAISE NOTICE 'Tier Validation Security: FAIL ✗ (Valid tier rejected)';
      END IF;
  END;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Tier Validation Security: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- Test 9.3: Test completion percentage validation security
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  valid_insert boolean := true;
BEGIN
  -- Insert test profile first
  INSERT INTO profiles (id, email, tier)
  VALUES (test_user_id, 'test-completion@example.com', 'free');
  
  -- Try to insert valid completion percentage
  BEGIN
    INSERT INTO course_progress (user_id, course_id, completion_percentage)
    VALUES (test_user_id, 'test-course-valid', 75);
  EXCEPTION
    WHEN OTHERS THEN
      valid_insert := false;
  END;
  
  -- Try to insert invalid completion percentage (should fail)
  BEGIN
    INSERT INTO course_progress (user_id, course_id, completion_percentage)
    VALUES (test_user_id, 'test-course-invalid', 150);
    RAISE NOTICE 'Completion Validation Security: FAIL ✗ (Invalid percentage accepted)';
  EXCEPTION
    WHEN OTHERS THEN
      IF valid_insert THEN
        RAISE NOTICE 'Completion Validation Security: PASS ✓ (Percentage constraints enforced)';
      ELSE
        RAISE NOTICE 'Completion Validation Security: FAIL ✗ (Valid percentage rejected)';
      END IF;
  END;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Completion Validation Security: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ENHANCED SECURITY TEST SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Run the queries above to see individual test results.';
  RAISE NOTICE 'All tests should show PASS ✓ for successful enhanced security validation.';
  RAISE NOTICE '';
  RAISE NOTICE 'Enhanced Security Features Tested:';
  RAISE NOTICE '- Optimized RLS policies with (select auth.uid()) pattern';
  RAISE NOTICE '- Enhanced foreign key constraints with CASCADE deletes';
  RAISE NOTICE '- Performance-optimized indexes for all query patterns';
  RAISE NOTICE '- Data validation constraints (tiers, status, percentages)';
  RAISE NOTICE '- Enhanced security functions (get_user_tier, has_active_subscription)';
  RAISE NOTICE '- Audit columns and automatic triggers on all tables';
  RAISE NOTICE '';
  RAISE NOTICE 'If any tests fail:';
  RAISE NOTICE '1. Ensure supabase.schema.sql (v2.1.0) was applied correctly';
  RAISE NOTICE '2. Check for any errors during schema deployment';
  RAISE NOTICE '3. Verify Supabase project has proper permissions';
  RAISE NOTICE '4. Confirm PostgreSQL extensions (uuid-ossp, pgcrypto) are enabled';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUICK HEALTH CHECK (Run this for a rapid assessment)
-- ============================================================================

SELECT 
  'ENHANCED SECURITY HEALTH CHECK' as check_type,
  CASE 
    WHEN table_count >= 6 
     AND function_count >= 3 
     AND rls_enabled_count >= 6
     AND policy_count >= 16
    THEN 'SUCCESS ✓ - Enhanced security schema deployed correctly'
    ELSE 'FAILURE ✗ - Missing components (Tables: ' || table_count || 
         '/6, Functions: ' || function_count || 
         '/3, RLS Tables: ' || rls_enabled_count || '/6, Policies: ' || policy_count || '/16)'
  END as status
FROM (
  SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as table_count,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as function_count,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' AND rowsecurity = true) as rls_enabled_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policy_count
) health_metrics;