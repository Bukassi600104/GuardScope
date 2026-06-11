-- GuardScope production rebuild for the repurposed Supabase project.
-- This removes the old Hilton Euphoria public tables and installs GuardScope tables only.

drop table if exists public.audit_log cascade;
drop table if exists public.bookings cascade;
drop table if exists public.blocked_dates cascade;
drop table if exists public.rooms cascade;
drop table if exists public.cms_pages cascade;
drop table if exists public.cms_site_settings cascade;
drop table if exists public.contact_inquiries cascade;
drop table if exists public.settings cascade;
drop table if exists public.admin_users cascade;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  team_id uuid,
  paystack_customer_code text,
  pro_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  analysis_count integer default 0,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2024),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month, year)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  seat_limit int not null default 5,
  stripe_subscription_id text,
  paystack_subscription_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique(team_id, user_id)
);

alter table public.users
  add column if not exists team_id uuid references public.teams(id),
  add column if not exists paystack_customer_code text,
  add column if not exists pro_expires_at timestamptz;

create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_domain text not null,
  risk_level text not null,
  risk_score int not null,
  analysis_path text not null,
  duration_ms int,
  analyzed_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'unused' check (status in ('unused', 'claimed', 'expired')),
  requester_name text,
  requester_email text,
  requester_country text,
  created_at timestamptz not null default now(),
  claim_deadline timestamptz not null default (now() + interval '30 days'),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  pro_expires_at timestamptz
);

create table if not exists public.control_panel_credentials (
  id text primary key default 'owner' check (id = 'owner'),
  username text not null default 'owner',
  recovery_email text not null default '',
  password_hash text not null,
  password_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_usage_updated_at on public.usage;
create trigger update_usage_updated_at
  before update on public.usage
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists teams_updated_at on public.teams;
create trigger teams_updated_at
  before update on public.teams
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_control_panel_credentials_updated_at on public.control_panel_credentials;
create trigger update_control_panel_credentials_updated_at
  before update on public.control_panel_credentials
  for each row execute procedure public.update_updated_at_column();

create index if not exists idx_usage_user_month_year on public.usage(user_id, month, year);
create index if not exists idx_users_stripe_customer on public.users(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_analysis_history_user_id on public.analysis_history(user_id, analyzed_at desc);
create index if not exists idx_promo_codes_code on public.promo_codes(code);
create index if not exists idx_promo_codes_email on public.promo_codes(requester_email);
create index if not exists idx_promo_codes_status on public.promo_codes(status);

alter table public.users enable row level security;
alter table public.usage enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.analysis_history enable row level security;
alter table public.promo_codes enable row level security;
alter table public.control_panel_credentials enable row level security;

drop policy if exists "Users can read own row" on public.users;
create policy "Users can read own row" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Service can insert users" on public.users;
create policy "Service can insert users" on public.users
  for insert with check (true);

drop policy if exists "Users can update own row" on public.users;

drop policy if exists "Users can read own usage" on public.usage;
create policy "Users can read own usage" on public.usage
  for select using (auth.uid() = user_id);

drop policy if exists "Service can manage usage" on public.usage;

drop policy if exists "team_owner_all" on public.teams;
create policy "team_owner_all" on public.teams
  for all using (owner_id = auth.uid());

drop policy if exists "team_member_read" on public.teams;
create policy "team_member_read" on public.teams
  for select using (
    id in (select team_id from public.team_members where user_id = auth.uid())
  );

drop policy if exists "own_membership" on public.team_members;
create policy "own_membership" on public.team_members
  for select using (user_id = auth.uid());

drop policy if exists "own_history" on public.analysis_history;
create policy "own_history" on public.analysis_history
  for all using (user_id = auth.uid());

drop policy if exists "service_role_all" on public.promo_codes;
create policy "service_role_all" on public.promo_codes
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on table public.control_panel_credentials from anon, authenticated;
grant select, insert, update on table public.control_panel_credentials to service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

do $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
begin
  if (select count(*) from public.promo_codes) = 0 then
    for i in 1..100 loop
      loop
        v_code := 'GS-' ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1) ||
          substr(chars, floor(random()*32)::int+1, 1);
        exit when not exists (select 1 from public.promo_codes where code = v_code);
      end loop;
      insert into public.promo_codes (code) values (v_code);
    end loop;
  end if;
end $$;
