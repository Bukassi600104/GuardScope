-- Migration 006: Control Panel owner password
-- Stores only a password hash. The plaintext owner password is never stored.

create table if not exists public.control_panel_credentials (
  id text primary key default 'owner' check (id = 'owner'),
  password_hash text not null,
  password_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.control_panel_credentials enable row level security;

-- No client-side access. The backend uses the service-role key only.
revoke all on table public.control_panel_credentials from anon, authenticated;
grant select, insert, update on table public.control_panel_credentials to service_role;

drop trigger if exists update_control_panel_credentials_updated_at on public.control_panel_credentials;
create trigger update_control_panel_credentials_updated_at
  before update on public.control_panel_credentials
  for each row execute procedure public.update_updated_at_column();
