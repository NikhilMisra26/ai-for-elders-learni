# Support Ticket System Database Migration Guide

## Overview

This guide documents the database schema and migration process for the support ticket system with comprehensive security and rate limiting.

## Migration Files

### 1. Main Migration: `20250116120000_create_support_tickets.sql`

**Purpose**: Creates the complete support ticket system with rate limiting and RLS policies.

**Tables Created**:
- `support_tickets` - Main ticket storage with denormalized user data
- `rate_limiting_support` - Rate limiting tracking table

**Functions Created**:
- `check_support_rate_limit()` - Validates rate limits
- `create_support_ticket()` - Secure ticket creation with rate limiting
- `cleanup_old_rate_limits()` - Maintenance function for old entries
- `populate_ticket_user_data()` - Auto-population trigger function

**Security Features**:
- Row Level Security (RLS) enabled on all tables
- Rate limiting at database level (3 tickets per hour default)
- User isolation - users can only see their own tickets
- Comprehensive audit logging with timestamps

### 2. Seed Data: `seed_support_tickets.sql`

**Purpose**: Provides test data for development and testing.

**Test Data Includes**:
- 6 sample tickets with various statuses and priorities
- Different categories (billing, technical, account, etc.)
- Rate limiting test entries
- Examples of admin responses and resolutions

## Migration Process

### Step 1: Apply Base Schema (If Not Already Present)

First, ensure your base Supabase schema is up to date:

```sql
-- In Supabase SQL Editor
-- Run the contents of supabase.schema.sql
```

### Step 2: Apply Support Ticket Migration

```sql
-- In Supabase SQL Editor
-- Run the contents of /supabase/migrations/20250116120000_create_support_tickets.sql
```

### Step 3: Verify Migration

Run these verification queries:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_tickets', 'rate_limiting_support');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('support_tickets', 'rate_limiting_support');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('support_tickets', 'rate_limiting_support');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_support_rate_limit', 'create_support_ticket', 'cleanup_old_rate_limits');
```

### Step 4: Load Test Data (Development Only)

```sql
-- In Supabase SQL Editor (DEVELOPMENT ONLY)
-- Run the contents of /supabase/seed_support_tickets.sql
```

### Step 5: Test Rate Limiting

```sql
-- Test rate limiting function
SELECT check_support_rate_limit(auth.uid(), 'ticket_create', 3, 60);

-- Try to create tickets (will fail after 3rd attempt within an hour)
SELECT create_support_ticket(
    'Test message for rate limiting',
    'general',
    'normal'
);
```

## Rollback Procedure

If you need to rollback the migration:

```sql
-- Step 1: Drop policies
DROP POLICY IF EXISTS "System can clean up old entries" ON public.rate_limiting_support;
DROP POLICY IF EXISTS "Rate limiting is per user" ON public.rate_limiting_support;
DROP POLICY IF EXISTS "Users can update their own pending tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS populate_ticket_user_data_trigger ON public.support_tickets;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS public.populate_ticket_user_data();
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();
DROP FUNCTION IF EXISTS public.create_support_ticket(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_support_rate_limit(UUID, TEXT, INTEGER, INTEGER);

-- Step 4: Drop tables
DROP TABLE IF EXISTS public.rate_limiting_support CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
```

## Security Considerations

### Row Level Security (RLS) Policies

1. **User Isolation**: Users can only view and create their own tickets
2. **Rate Limiting**: Enforced at database level to prevent abuse
3. **Status Protection**: Users cannot change ticket status directly
4. **Time-Limited Edits**: Users can only edit pending tickets within 24 hours

### Rate Limiting Strategy

- **Default Limits**: 3 tickets per hour per user
- **Configurable**: Can adjust limits in `check_support_rate_limit()` function
- **Automatic Cleanup**: Old rate limit entries removed after 2 hours
- **Database Enforced**: Cannot be bypassed by client-side code

### Data Denormalization

User email, name, and tier are denormalized into tickets for:
- **Performance**: No joins needed for admin views
- **Historical Accuracy**: Preserves user data at time of ticket creation
- **Audit Trail**: Changes to user profile don't affect ticket history

## Performance Optimizations

### Indexes Created

1. **Primary Lookups**:
   - `idx_support_tickets_user_id` - User's tickets
   - `idx_support_tickets_status` - Active tickets (pending/in_progress)

2. **Admin Queries**:
   - `idx_support_tickets_priority_status` - Priority queue
   - `idx_support_tickets_created_at` - Recent tickets

3. **Rate Limiting**:
   - `idx_rate_limiting_support_user_time` - Rate limit checks
   - `idx_rate_limiting_support_old_entries` - Cleanup operations

### Query Patterns Optimized

```sql
-- User viewing their tickets (uses idx_support_tickets_user_id)
SELECT * FROM support_tickets 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;

-- Admin priority queue (uses idx_support_tickets_priority_status)
SELECT * FROM support_tickets 
WHERE status IN ('pending', 'in_progress') 
ORDER BY priority DESC, created_at ASC;

-- Rate limit check (uses idx_rate_limiting_support_user_time)
SELECT COUNT(*) FROM rate_limiting_support 
WHERE user_id = ? 
AND action_type = ? 
AND created_at > NOW() - INTERVAL '1 hour';
```

## Testing Recommendations

### Unit Tests

1. **Rate Limiting**:
   - Test 3 ticket limit enforcement
   - Test time window reset
   - Test cleanup function

2. **RLS Policies**:
   - Test user can only see own tickets
   - Test user cannot modify resolved tickets
   - Test user cannot change ticket status

3. **Data Integrity**:
   - Test message length constraints (10-2000 chars)
   - Test valid status/priority/category values
   - Test user data auto-population

### Integration Tests

1. **Full Ticket Lifecycle**:
   - Create ticket → In Progress → Resolved → Closed
   - Test admin response flow
   - Test notification triggers

2. **Concurrent Access**:
   - Multiple users creating tickets simultaneously
   - Rate limiting under load
   - Database lock handling

### Security Tests

1. **SQL Injection**:
   - Test message field with SQL commands
   - Test category/priority with invalid values

2. **Authorization**:
   - Test accessing other users' tickets
   - Test modifying closed tickets
   - Test bypassing rate limits

## Maintenance Tasks

### Daily
- Monitor pending ticket count
- Check for stuck "in_progress" tickets

### Weekly
- Run cleanup function for old rate limits:
  ```sql
  SELECT cleanup_old_rate_limits();
  ```

### Monthly
- Analyze ticket trends and adjust rate limits if needed
- Archive closed tickets older than 6 months
- Review and optimize slow queries

## Next Steps

After applying the migration:

1. **Create UI Components**:
   - Support ticket form with validation
   - Ticket list/dashboard for users
   - Admin interface for ticket management

2. **Implement Email Notifications**:
   - New ticket confirmation
   - Admin response notifications
   - Resolution notifications

3. **Add Analytics**:
   - Average response time tracking
   - Resolution time metrics
   - Category/priority distribution

4. **Configure Monitoring**:
   - Alert on high priority tickets
   - Monitor rate limit violations
   - Track database performance

## Support

For issues with this migration:
1. Check Supabase logs for detailed error messages
2. Verify user has proper authentication
3. Ensure RLS policies are correctly applied
4. Test with minimal example first