-- Server-only abuse telemetry and database-backed rate limits.
-- These tables intentionally store hashed identifiers only. Raw IP
-- addresses, user agents, and emails must not be written here.

create table if not exists public.api_rate_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  identifier_hash text not null,
  allowed boolean not null default true,
  reason text not null default 'allowed',
  created_at timestamptz not null default now()
);

create index if not exists api_rate_events_scope_identifier_created_idx
  on public.api_rate_events (scope, identifier_hash, created_at desc);

create index if not exists api_rate_events_created_idx
  on public.api_rate_events (created_at desc);

alter table public.api_rate_events enable row level security;

revoke all on public.api_rate_events from anon, authenticated;
grant select, insert on public.api_rate_events to service_role;

create table if not exists public.promo_claim_attempts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text not null,
  user_agent_hash text,
  email_domain text,
  allowed boolean not null default true,
  reason text not null default 'allowed',
  created_at timestamptz not null default now()
);

create index if not exists promo_claim_attempts_email_created_idx
  on public.promo_claim_attempts (email_hash, created_at desc);

create index if not exists promo_claim_attempts_ip_created_idx
  on public.promo_claim_attempts (ip_hash, created_at desc);

create index if not exists promo_claim_attempts_domain_created_idx
  on public.promo_claim_attempts (email_domain, created_at desc);

create index if not exists promo_claim_attempts_allowed_created_idx
  on public.promo_claim_attempts (allowed, created_at desc);

alter table public.promo_claim_attempts enable row level security;

revoke all on public.promo_claim_attempts from anon, authenticated;
grant select, insert on public.promo_claim_attempts to service_role;

alter table public.promo_codes
  add column if not exists assigned_at timestamptz,
  add column if not exists requester_ip_hash text,
  add column if not exists requester_ua_hash text,
  add column if not exists request_source text;

create index if not exists promo_codes_requester_email_created_idx
  on public.promo_codes (requester_email, created_at desc)
  where requester_email is not null;

create index if not exists promo_codes_assigned_at_idx
  on public.promo_codes (assigned_at desc)
  where assigned_at is not null;
