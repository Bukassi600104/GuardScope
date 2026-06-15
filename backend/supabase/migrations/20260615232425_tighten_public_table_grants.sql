-- Tighten direct Supabase Data API access for production user tables.
-- Backend API routes continue to use the service role for all mutations.

-- Users should be able to read their own profile row only; account creation is
-- handled by the auth trigger/admin API, not by public table inserts.
drop policy if exists "Service can insert users" on public.users;
drop policy if exists "service_role_insert_users" on public.users;
create policy "service_role_insert_users"
  on public.users
  for insert
  to service_role
  with check (true);

revoke all on table public.users from anon;
revoke insert, update, delete, truncate, references, trigger on table public.users from authenticated;
grant select on table public.users to authenticated;

-- Usage is read-only to clients; quota increments happen only through backend.
revoke all on table public.usage from anon;
revoke insert, update, delete, truncate, references, trigger on table public.usage from authenticated;
grant select on table public.usage to authenticated;

-- Analysis history is read-only to clients. Backend writes metadata after a scan.
drop policy if exists "own_history" on public.analysis_history;
drop policy if exists "Users can read own analysis history" on public.analysis_history;
create policy "Users can read own analysis history"
  on public.analysis_history
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.analysis_history from anon;
revoke insert, update, delete, truncate, references, trigger on table public.analysis_history from authenticated;
grant select on table public.analysis_history to authenticated;

-- Promo code inventory must not be directly readable or mutable from clients.
revoke all on table public.promo_codes from anon, authenticated;
grant select, insert, update, delete on table public.promo_codes to service_role;
