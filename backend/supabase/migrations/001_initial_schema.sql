-- GuardScope Initial Schema
-- Run this in the Supabase SQL Editor

-- ─────────────────────────────────────────────────────
-- Users table
-- Mirrors auth.users with application-specific fields
-- ─────────────────────────────────────────────────────
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row-Level Security
alter table public.users enable row level security;

-- Users can only read their own row
create policy "Users can read own row"
  on public.users
  for select
  using (auth.uid() = id);

-- Users CANNOT update their own row via client — tier and billing fields are service-only.
-- All user profile mutations go through service-role API calls.
-- (Intentionally no client-side update policy on public.users)

-- Service role can insert new user rows (via trigger)
create policy "Service can insert users"
  on public.users
  for insert
  with check (true);

-- ─────────────────────────────────────────────────────
-- Auto-create user row on signup
-- ─────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────
-- Usage table
-- Tracks monthly analysis count per user
-- ─────────────────────────────────────────────────────
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  analysis_count integer default 0,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2024),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month, year)
);

-- Enable Row-Level Security
alter table public.usage enable row level security;

-- Users can read their own usage
create policy "Users can read own usage"
  on public.usage
  for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS by default — no explicit policy needed for backend writes.
-- Authenticated users can only read their own usage row (no insert/update/delete via client).
-- All quota mutations happen server-side via service-role key.

-- ─────────────────────────────────────────────────────
-- Updated_at trigger (auto-update timestamp)
-- ─────────────────────────────────────────────────────
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_usage_updated_at
  before update on public.usage
  for each row execute procedure public.update_updated_at_column();

-- ─────────────────────────────────────────────────────
-- Indexes for performance
-- ─────────────────────────────────────────────────────
create index idx_usage_user_month_year on public.usage(user_id, month, year);
create index idx_users_stripe_customer on public.users(stripe_customer_id) where stripe_customer_id is not null;
