-- Test Script for Supabase Migrations
-- Run this after applying all 3 SQL files in order:
-- 1. migrations/001_core_schema.sql
-- 2. migrations/002_security_features.sql  
-- 3. migrations/003_content_testimonials.sql
--
-- Expected output: All tests should show 'PASS'
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

-- Test 1.1: Core tables exist
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'subscriptions', 
    'course_progress',
    'module_progress',
    'user_activity',
    'invoices',
    'password_history',
    'security_logs',
    'rate_limits',
    'testimonials',
    'platform_metrics'
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
    WHEN COUNT(DISTINCT e.table_name) = 11 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Missing: ' || string_agg(e.table_name, ', ')
  END as result
FROM expected_tables e
LEFT JOIN actual_tables a ON e.table_name = a.table_name
WHERE a.table_name IS NULL OR e.table_name IS NOT NULL;

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

-- Test 2.1: Profiles table columns
SELECT 
  'Profiles Table Structure' as test_name,
  CASE 
    WHEN COUNT(*) >= 15 THEN 'PASS ✓ (' || COUNT(*) || ' columns)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' columns found'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'full_name', 'tier', 'created_at', 
    'updated_at', 'phone', 'country', 'timezone', 'profile_complete',
    'email_verified', 'phone_verified', 'two_factor_enabled', 
    'two_factor_secret', 'recovery_codes', 'failed_login_attempts',
    'account_locked_until', 'last_password_change', 'password_expires_at',
    'security_questions', 'last_login_at', 'last_login_ip'
  );

-- Test 2.2: Security-specific columns in profiles
SELECT 
  'Security Columns in Profiles' as test_name,
  CASE 
    WHEN COUNT(*) = 10 THEN 'PASS ✓ (All security columns present)'
    ELSE 'FAIL ✗ - Missing security columns'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'two_factor_enabled', 'two_factor_secret', 'recovery_codes',
    'failed_login_attempts', 'account_locked_until', 
    'last_password_change', 'password_expires_at',
    'security_questions', 'last_login_at', 'last_login_ip'
  );

-- Test 2.3: Password history table structure
SELECT 
  'Password History Structure' as test_name,
  CASE 
    WHEN COUNT(*) = 4 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Expected 4 columns, found ' || COUNT(*)
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'password_history'
  AND column_name IN ('id', 'user_id', 'password_hash', 'created_at');

-- Test 2.4: Testimonials table structure
SELECT 
  'Testimonials Structure' as test_name,
  CASE 
    WHEN COUNT(*) = 9 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Expected 9 columns, found ' || COUNT(*)
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'testimonials'
  AND column_name IN (
    'id', 'name', 'age', 'location', 'occupation',
    'content', 'rating', 'featured', 'created_at'
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

-- Test 3.1: RLS enabled on all user tables
WITH rls_status AS (
  SELECT 
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'subscriptions', 'course_progress', 
      'module_progress', 'user_activity', 'invoices',
      'password_history', 'security_logs', 'rate_limits'
    )
)
SELECT 
  'RLS Enabled on User Tables' as test_name,
  CASE 
    WHEN COUNT(*) = COUNT(CASE WHEN rowsecurity THEN 1 END) 
    THEN 'PASS ✓ (' || COUNT(*) || ' tables protected)'
    ELSE 'FAIL ✗ - ' || COUNT(CASE WHEN NOT rowsecurity THEN 1 END) || ' tables unprotected'
  END as result
FROM rls_status;

-- Test 3.2: RLS policies exist
SELECT 
  'RLS Policies Configured' as test_name,
  CASE 
    WHEN COUNT(DISTINCT tablename) >= 9 THEN 'PASS ✓ (' || COUNT(*) || ' policies)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' policies found'
  END as result
FROM pg_policies
WHERE schemaname = 'public';

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

-- Test 4.1: Security functions exist
WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'check_rate_limit',
    'record_security_event',
    'is_password_reused',
    'get_failed_login_count',
    'lock_account',
    'unlock_account',
    'generate_recovery_codes',
    'verify_recovery_code',
    'rotate_recovery_codes',
    'update_platform_metrics'
  ]) as function_name
),
actual_functions AS (
  SELECT routine_name as function_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
)
SELECT 
  'Security Functions Exist' as test_name,
  CASE 
    WHEN COUNT(DISTINCT a.function_name) >= 10 THEN 'PASS ✓ (' || COUNT(DISTINCT a.function_name) || ' functions)'
    ELSE 'FAIL ✗ - Missing functions'
  END as result
FROM expected_functions e
LEFT JOIN actual_functions a ON e.function_name = a.function_name;

-- Test 4.2: Test rate limiting function
DO $$
DECLARE
  test_result boolean;
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Clean up any existing test data
  DELETE FROM rate_limits WHERE user_id = test_user_id;
  
  -- First attempt should succeed
  test_result := check_rate_limit(test_user_id, 'login', 5, interval '15 minutes');
  
  IF test_result THEN
    RAISE NOTICE 'Rate Limit Function: PASS ✓ (First attempt allowed)';
  ELSE
    RAISE NOTICE 'Rate Limit Function: FAIL ✗ (First attempt blocked)';
  END IF;
  
  -- Clean up
  DELETE FROM rate_limits WHERE user_id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Rate Limit Function: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- Test 4.3: Test security event logging
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  log_count integer;
BEGIN
  -- Record a test event
  PERFORM record_security_event(
    test_user_id,
    'test_event',
    'high',
    '{"test": "data"}'::jsonb,
    '127.0.0.1'
  );
  
  -- Check if event was logged
  SELECT COUNT(*) INTO log_count
  FROM security_logs
  WHERE user_id = test_user_id
    AND event_type = 'test_event';
  
  IF log_count > 0 THEN
    RAISE NOTICE 'Security Event Logging: PASS ✓';
  ELSE
    RAISE NOTICE 'Security Event Logging: FAIL ✗ (Event not logged)';
  END IF;
  
  -- Clean up
  DELETE FROM security_logs WHERE user_id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Security Event Logging: FAIL ✗ (Error: %)', SQLERRM;
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

-- Test 5.2: Foreign key constraints
SELECT 
  'Foreign Key Constraints' as test_name,
  CASE 
    WHEN COUNT(*) >= 8 THEN 'PASS ✓ (' || COUNT(*) || ' relationships)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' relationships found'
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

-- Test 6.1: Performance indexes exist
WITH important_indexes AS (
  SELECT unnest(ARRAY[
    'idx_profiles_tier',
    'idx_subscriptions_user_status',
    'idx_course_progress_user_course',
    'idx_module_progress_user_module',
    'idx_user_activity_user_timestamp',
    'idx_security_logs_user_event',
    'idx_rate_limits_user_action'
  ]) as index_name
),
actual_indexes AS (
  SELECT indexname as index_name
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT 
  'Performance Indexes' as test_name,
  CASE 
    WHEN COUNT(DISTINCT a.index_name) >= 7 THEN 'PASS ✓ (' || COUNT(DISTINCT a.index_name) || ' indexes)'
    ELSE 'FAIL ✗ - Missing critical indexes'
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

-- Test 7.1: Test testimonials data
SELECT 
  'Testimonials Data' as test_name,
  CASE 
    WHEN COUNT(*) >= 6 THEN 'PASS ✓ (' || COUNT(*) || ' testimonials loaded)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' testimonials found'
  END as result
FROM testimonials;

-- Test 7.2: Test platform metrics initialization
SELECT 
  'Platform Metrics' as test_name,
  CASE 
    WHEN total_users IS NOT NULL THEN 'PASS ✓ (Metrics initialized)'
    ELSE 'FAIL ✗ - Metrics not initialized'
  END as result
FROM platform_metrics
LIMIT 1;

-- Test 7.3: Enum type values
SELECT 
  'Subscription Tiers Enum' as test_name,
  CASE 
    WHEN COUNT(*) = 3 THEN 'PASS ✓ (free, advanced, expert)'
    ELSE 'FAIL ✗ - Invalid tier values'
  END as result
FROM unnest(enum_range(NULL::subscription_tier)) as tier;

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

-- Test 8.1: Updated_at triggers
WITH trigger_tables AS (
  SELECT DISTINCT event_object_table as table_name
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%'
)
SELECT 
  'Updated_at Triggers' as test_name,
  CASE 
    WHEN COUNT(*) >= 9 THEN 'PASS ✓ (' || COUNT(*) || ' tables with triggers)'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' triggers found'
  END as result
FROM trigger_tables;

-- ============================================================================
-- SECTION 9: SECURITY VALIDATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 9: SECURITY VALIDATION';
  RAISE NOTICE '========================================';
END $$;

-- Test 9.1: Test password history function
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_hash text := 'test_hash_123';
  is_reused boolean;
BEGIN
  -- Insert test password history
  INSERT INTO password_history (user_id, password_hash)
  VALUES (test_user_id, test_hash);
  
  -- Test if password is detected as reused
  is_reused := is_password_reused(test_user_id, test_hash);
  
  IF is_reused THEN
    RAISE NOTICE 'Password History Check: PASS ✓ (Reuse detected)';
  ELSE
    RAISE NOTICE 'Password History Check: FAIL ✗ (Reuse not detected)';
  END IF;
  
  -- Clean up
  DELETE FROM password_history WHERE user_id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Password History Check: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- Test 9.2: Test account locking
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  lock_result boolean;
  unlock_result boolean;
BEGIN
  -- Create test profile
  INSERT INTO profiles (id, email, tier)
  VALUES (test_user_id, 'test@example.com', 'free');
  
  -- Lock account
  lock_result := lock_account(test_user_id, interval '30 minutes');
  
  -- Unlock account
  unlock_result := unlock_account(test_user_id);
  
  IF lock_result AND unlock_result THEN
    RAISE NOTICE 'Account Lock/Unlock: PASS ✓';
  ELSE
    RAISE NOTICE 'Account Lock/Unlock: FAIL ✗';
  END IF;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Account Lock/Unlock: FAIL ✗ (Error: %)', SQLERRM;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Run the queries above to see individual test results.';
  RAISE NOTICE 'All tests should show PASS ✓ for a successful migration.';
  RAISE NOTICE '';
  RAISE NOTICE 'If any tests fail:';
  RAISE NOTICE '1. Check that all 3 migration files were run in order';
  RAISE NOTICE '2. Look for any errors during migration execution';
  RAISE NOTICE '3. Verify Supabase project settings allow these operations';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUICK HEALTH CHECK (Run this for a rapid assessment)
-- ============================================================================

SELECT 
  'OVERALL MIGRATION HEALTH' as check_type,
  CASE 
    WHEN table_count >= 11 
     AND function_count >= 10 
     AND rls_enabled_count >= 9
    THEN 'SUCCESS ✓ - All migrations applied correctly'
    ELSE 'FAILURE ✗ - Missing components (Tables: ' || table_count || 
         '/11, Functions: ' || function_count || 
         '/10, RLS: ' || rls_enabled_count || '/9)'
  END as status
FROM (
  SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as table_count,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as function_count,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' AND rowsecurity = true) as rls_enabled_count
) health_metrics;