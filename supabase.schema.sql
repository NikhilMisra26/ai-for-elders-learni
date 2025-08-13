-- Supabase SQL schema for DISCOVER 50 AI
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Profiles table to extend auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  tier text not null default 'free' check (tier in ('free','advanced','expert')),
  verified boolean not null default false,
  join_date timestamptz not null default now(),
  last_login_at timestamptz,
  login_attempts integer not null default 0,
  is_locked boolean not null default false,
  locked_until timestamptz
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by owner" on public.profiles
for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
for update using (auth.uid() = id);

-- Subscription table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('free','advanced','expert')),
  status text not null check (status in ('active','cancelled','expired','trial','grace_period')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  next_billing_date timestamptz,
  trial_end_date timestamptz,
  grace_period_end timestamptz,
  payment_brand text,
  payment_last4 text,
  cancel_at_period_end boolean not null default false,
  auto_renew boolean not null default true
);

alter table public.subscriptions enable row level security;

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

create policy "Users access their subscriptions" on public.subscriptions
for all using (auth.uid() = user_id);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null default now(),
  amount numeric not null,
  plan_name text not null,
  status text not null check (status in ('paid','pending','failed')),
  download_url text
);

alter table public.invoices enable row level security;
create policy "Users access their invoices" on public.invoices
for all using (auth.uid() = user_id);

-- Progress tables
create table if not exists public.course_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  started_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  completed_modules text[] not null default '{}',
  current_module_id text,
  total_time_spent integer not null default 0,
  completion_percentage integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz
);

alter table public.course_progress enable row level security;
create index if not exists idx_course_progress_user on public.course_progress(user_id);
create policy "Users access their course progress" on public.course_progress
for all using (auth.uid() = user_id);

create table if not exists public.module_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  course_id text not null,
  completed_at timestamptz not null default now(),
  time_spent integer not null default 0,
  rating integer,
  attempts integer not null default 1,
  notes text
);

alter table public.module_progress enable row level security;
create index if not exists idx_module_progress_user on public.module_progress(user_id);
create policy "Users access their module progress" on public.module_progress
for all using (auth.uid() = user_id);

-- Activity table
create table if not exists public.user_activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  timestamp timestamptz not null default now(),
  course_id text,
  module_id text,
  metadata jsonb
);

alter table public.user_activity enable row level security;
create index if not exists idx_user_activity_user on public.user_activity(user_id);
create policy "Users access their activity" on public.user_activity
for all using (auth.uid() = user_id);
