-- Migration: Access Control and Security Tables
-- Description: Adds comprehensive access logging, content validation, and security monitoring tables

-- ========================================================================
-- Access Attempts Table
-- ========================================================================

-- Table for logging all content access attempts (successful and failed)
create table if not exists public.access_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('course', 'module', 'lesson')),
  resource_id text not null,
  required_tier text not null check (required_tier in ('free', 'advanced', 'expert')),
  user_tier text not null check (user_tier in ('free', 'advanced', 'expert')),
  access_granted boolean not null,
  denial_reason text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  suspicious boolean default false,
  timestamp timestamptz not null default now()
);

-- Indexes for efficient querying
create index idx_access_attempts_user on public.access_attempts(user_id);
create index idx_access_attempts_timestamp on public.access_attempts(timestamp);
create index idx_access_attempts_resource on public.access_attempts(resource_type, resource_id);
create index idx_access_attempts_suspicious on public.access_attempts(suspicious) where suspicious = true;

-- Row Level Security
alter table public.access_attempts enable row level security;

-- Users can only see their own access attempts
create policy "Users view own access attempts" on public.access_attempts
for select using (auth.uid() = user_id);

-- Service role can insert and view all attempts
create policy "Service role manages access attempts" on public.access_attempts
for all using (auth.jwt() ->> 'role' = 'service_role');

-- ========================================================================
-- Content Access Rules Table
-- ========================================================================

-- Define access rules for specific content
create table if not exists public.content_access_rules (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null check (content_type in ('course', 'module', 'lesson')),
  content_id text not null,
  required_tier text not null check (required_tier in ('free', 'advanced', 'expert')),
  is_active boolean not null default true,
  override_rules jsonb, -- For special access cases (e.g., beta testers, promotions)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure unique rules per content
  unique(content_type, content_id)
);

create index idx_content_access_rules_content on public.content_access_rules(content_type, content_id);
create index idx_content_access_rules_active on public.content_access_rules(is_active) where is_active = true;

-- RLS policies
alter table public.content_access_rules enable row level security;

-- Read-only for authenticated users
create policy "Authenticated users can view active rules" on public.content_access_rules
for select using (auth.role() = 'authenticated' and is_active = true);

-- Service role can manage all rules
create policy "Service role manages content rules" on public.content_access_rules
for all using (auth.jwt() ->> 'role' = 'service_role');

-- ========================================================================
-- Subscription Access Cache Table
-- ========================================================================

-- Cache validated access permissions for performance
create table if not exists public.subscription_access_cache (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_key text not null, -- Format: "type:id" e.g., "course:ai-basics"
  has_access boolean not null,
  validated_at timestamptz not null default now(),
  expires_at timestamptz not null, -- Cache expiration
  user_tier text not null check (user_tier in ('free', 'advanced', 'expert')),
  
  -- Unique cache entry per user and resource
  unique(user_id, resource_key)
);

create index idx_access_cache_user on public.subscription_access_cache(user_id);
create index idx_access_cache_expires on public.subscription_access_cache(expires_at);
create index idx_access_cache_resource on public.subscription_access_cache(resource_key);

-- RLS policies
alter table public.subscription_access_cache enable row level security;

create policy "Users can view own cache" on public.subscription_access_cache
for select using (auth.uid() = user_id);

create policy "Service role manages cache" on public.subscription_access_cache
for all using (auth.jwt() ->> 'role' = 'service_role');

-- ========================================================================
-- Security Events Table
-- ========================================================================

-- Track security-relevant events for monitoring
create table if not exists public.security_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  user_id uuid references auth.users(id) on delete set null,
  description text not null,
  metadata jsonb,
  ip_address text,
  user_agent text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_security_events_type on public.security_events(event_type);
create index idx_security_events_severity on public.security_events(severity);
create index idx_security_events_user on public.security_events(user_id);
create index idx_security_events_unresolved on public.security_events(resolved) where resolved = false;
create index idx_security_events_created on public.security_events(created_at);

-- RLS policies
alter table public.security_events enable row level security;

-- Only admins can view security events
create policy "Admins view security events" on public.security_events
for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.tier = 'expert' -- Or add an is_admin field
  )
);

-- Service role full access
create policy "Service role manages security events" on public.security_events
for all using (auth.jwt() ->> 'role' = 'service_role');

-- ========================================================================
-- Error Logs Table (for Edge Functions)
-- ========================================================================

create table if not exists public.error_logs (
  id uuid primary key default uuid_generate_v4(),
  function_name text not null,
  error_message text not null,
  error_stack text,
  user_id uuid references auth.users(id) on delete set null,
  request_data jsonb,
  timestamp timestamptz not null default now()
);

create index idx_error_logs_function on public.error_logs(function_name);
create index idx_error_logs_timestamp on public.error_logs(timestamp);

-- RLS policies
alter table public.error_logs enable row level security;

-- Service role only
create policy "Service role manages error logs" on public.error_logs
for all using (auth.jwt() ->> 'role' = 'service_role');

-- ========================================================================
-- Functions and Triggers
-- ========================================================================

-- Function to clean expired cache entries
create or replace function clean_expired_access_cache()
returns void as $$
begin
  delete from public.subscription_access_cache
  where expires_at < now();
end;
$$ language plpgsql security definer;

-- Function to detect suspicious access patterns
create or replace function detect_suspicious_access()
returns trigger as $$
declare
  recent_failed_attempts integer;
  different_resources integer;
begin
  -- Count recent failed attempts
  select count(*)
  into recent_failed_attempts
  from public.access_attempts
  where user_id = new.user_id
    and access_granted = false
    and timestamp > now() - interval '5 minutes';

  -- Count different resources attempted
  select count(distinct resource_id)
  into different_resources
  from public.access_attempts
  where user_id = new.user_id
    and access_granted = false
    and timestamp > now() - interval '10 minutes';

  -- Mark as suspicious if thresholds exceeded
  if recent_failed_attempts > 10 or different_resources > 5 then
    new.suspicious := true;
    
    -- Log security event
    insert into public.security_events (
      event_type,
      severity,
      user_id,
      description,
      metadata,
      ip_address,
      user_agent
    ) values (
      'suspicious_access_pattern',
      case 
        when recent_failed_attempts > 20 then 'high'
        when recent_failed_attempts > 15 then 'medium'
        else 'low'
      end,
      new.user_id,
      format('User has %s failed access attempts to %s different resources', 
             recent_failed_attempts, different_resources),
      jsonb_build_object(
        'failed_attempts', recent_failed_attempts,
        'different_resources', different_resources,
        'resource_type', new.resource_type,
        'resource_id', new.resource_id
      ),
      new.ip_address,
      new.user_agent
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for suspicious access detection
create trigger detect_suspicious_access_trigger
before insert on public.access_attempts
for each row
when (new.access_granted = false)
execute function detect_suspicious_access();

-- Function to invalidate cache when subscription changes
create or replace function invalidate_access_cache_on_subscription_change()
returns trigger as $$
begin
  -- Delete all cached entries for the user when their subscription changes
  delete from public.subscription_access_cache
  where user_id = coalesce(new.user_id, old.user_id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to invalidate cache on subscription changes
create trigger invalidate_cache_on_subscription_change
after insert or update or delete on public.subscriptions
for each row
execute function invalidate_access_cache_on_subscription_change();

-- ========================================================================
-- Scheduled Jobs (Run via pg_cron or external scheduler)
-- ========================================================================

-- Clean expired cache entries every hour
-- Run: select clean_expired_access_cache();

-- ========================================================================
-- Initial Data
-- ========================================================================

-- Insert default content access rules
insert into public.content_access_rules (content_type, content_id, required_tier)
values 
  ('course', 'ai-basics', 'free'),
  ('course', 'ai-assistant', 'advanced'),
  ('course', 'advanced-ai', 'expert')
on conflict (content_type, content_id) do nothing;

-- ========================================================================
-- Grants
-- ========================================================================

-- Grant necessary permissions to authenticated users
grant select on public.content_access_rules to authenticated;
grant select on public.access_attempts to authenticated;
grant select on public.subscription_access_cache to authenticated;

-- Grant full access to service role
grant all on public.access_attempts to service_role;
grant all on public.content_access_rules to service_role;
grant all on public.subscription_access_cache to service_role;
grant all on public.security_events to service_role;
grant all on public.error_logs to service_role;

-- Grant execute on functions
grant execute on function clean_expired_access_cache() to service_role;

-- ========================================================================
-- Comments
-- ========================================================================

comment on table public.access_attempts is 'Logs all content access attempts for security monitoring and analytics';
comment on table public.content_access_rules is 'Defines tier requirements for accessing specific content';
comment on table public.subscription_access_cache is 'Caches validated access permissions for performance optimization';
comment on table public.security_events is 'Tracks security-relevant events for monitoring and incident response';
comment on table public.error_logs is 'Logs errors from edge functions and API endpoints';