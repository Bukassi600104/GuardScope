-- Migration 007: Owner Control Center operational events
-- Stores backend/support issue metadata only. Do not store email bodies, subjects,
-- recipients, headers, or scanned message content in this table.

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'error', 'critical')),
  source text not null,
  event_type text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_operational_events_status_created
  on public.operational_events(status, created_at desc);

create index if not exists idx_operational_events_severity_created
  on public.operational_events(severity, created_at desc);

alter table public.operational_events enable row level security;

-- Owner dashboard reads this table through the backend service-role key only.
revoke all on table public.operational_events from anon, authenticated;
grant select, insert, update on table public.operational_events to service_role;
