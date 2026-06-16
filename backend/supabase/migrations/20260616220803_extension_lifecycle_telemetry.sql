-- Privacy-safe extension lifecycle telemetry for owner install/uninstall
-- monitoring. Stores a server-side HMAC of the extension-generated install ID,
-- never email content, Gmail data, raw IPs, or browser history.

create table if not exists public.extension_installations (
  install_id_hash text primary key,
  extension_id text not null,
  version text not null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uninstalled_at timestamptz,
  last_event_at timestamptz not null default now(),
  event_count integer not null default 1 check (event_count >= 1)
);

create table if not exists public.extension_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  install_id_hash text not null references public.extension_installations(install_id_hash) on delete cascade,
  event_type text not null check (event_type in ('install', 'update', 'uninstall')),
  extension_id text not null,
  version text,
  previous_version text,
  created_at timestamptz not null default now()
);

create index if not exists idx_extension_installations_last_event
  on public.extension_installations(last_event_at desc);

create index if not exists idx_extension_installations_uninstalled
  on public.extension_installations(uninstalled_at)
  where uninstalled_at is not null;

create index if not exists idx_extension_lifecycle_events_created
  on public.extension_lifecycle_events(created_at desc);

alter table public.extension_installations enable row level security;
alter table public.extension_lifecycle_events enable row level security;

revoke all on table public.extension_installations from anon, authenticated;
revoke all on table public.extension_lifecycle_events from anon, authenticated;

grant select, insert, update on table public.extension_installations to service_role;
grant select, insert on table public.extension_lifecycle_events to service_role;

drop policy if exists "service_role_all" on public.extension_installations;
create policy "service_role_all"
  on public.extension_installations
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role_insert" on public.extension_lifecycle_events;
create policy "service_role_insert"
  on public.extension_lifecycle_events
  for insert
  to service_role
  with check (true);

drop policy if exists "service_role_read" on public.extension_lifecycle_events;
create policy "service_role_read"
  on public.extension_lifecycle_events
  for select
  to service_role
  using (true);
