-- Add testimonials table to Supabase
-- Run this in Supabase SQL Editor after the main schema

-- Testimonials table for user reviews
create table if not exists public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_location text,
  course_tier text not null check (course_tier in ('free','advanced','expert')),
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  is_approved boolean not null default false,
  display_order integer,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

alter table public.testimonials enable row level security;

-- Index for efficient queries
create index if not exists idx_testimonials_approved on public.testimonials(is_approved, display_order);
create index if not exists idx_testimonials_user on public.testimonials(user_id);

-- RLS policies
-- Users can read approved testimonials
create policy "Anyone can read approved testimonials" on public.testimonials
for select using (is_approved = true);

-- Users can read their own testimonials (approved or not)
create policy "Users can read their own testimonials" on public.testimonials
for select using (auth.uid() = user_id);

-- Users can create their own testimonials
create policy "Users can create testimonials" on public.testimonials
for insert with check (auth.uid() = user_id);

-- Users can update their own testimonials (only if not yet approved)
create policy "Users can update their unapproved testimonials" on public.testimonials
for update using (auth.uid() = user_id and is_approved = false);

-- Users can delete their own testimonials (only if not yet approved)
create policy "Users can delete their unapproved testimonials" on public.testimonials
for delete using (auth.uid() = user_id and is_approved = false);

-- Function to get platform statistics
create or replace function get_platform_stats()
returns json
language plpgsql
security definer
as $$
declare
  total_users integer;
  avg_completion numeric;
  avg_rating numeric;
  countries_count integer;
begin
  -- Get total user count
  select count(*) into total_users from public.profiles;
  
  -- Get average completion rate (only for users who started courses)
  select avg(completion_percentage) into avg_completion 
  from public.course_progress 
  where completion_percentage > 0;
  
  -- Get average rating from approved testimonials
  select avg(rating) into avg_rating 
  from public.testimonials 
  where is_approved = true;
  
  -- For now, countries count is estimated (can be enhanced later with real geo data)
  -- Using a simple formula based on user count
  countries_count := least(50, greatest(1, total_users / 300));
  
  return json_build_object(
    'total_users', total_users,
    'avg_completion', coalesce(avg_completion, 0),
    'avg_rating', coalesce(avg_rating, 0),
    'countries_count', countries_count
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_platform_stats to authenticated;