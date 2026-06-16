-- Tighten older public grants and public-schema functions. This migration keeps
-- the existing application behavior, but removes unnecessary anonymous access
-- paths and narrows RLS policies to the roles that actually use them.

-- Team tables were created by an early migration with broad default grants.
-- RLS blocked anonymous row access, but the table grants themselves were still
-- too broad for a production security posture.
revoke all on table public.teams from anon;
revoke all on table public.team_members from anon;

revoke all on table public.teams from authenticated;
grant select, insert, update, delete on table public.teams to authenticated;

revoke all on table public.team_members from authenticated;
grant select on table public.team_members to authenticated;

-- Replace broad-role RLS policies with authenticated-only policies and wrap
-- auth.* calls in SELECT so Postgres does not re-evaluate them for every row.
drop policy if exists "Users can read own row" on public.users;
create policy "Users can read own row"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can read own usage" on public.usage;
create policy "Users can read own usage"
  on public.usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own analysis history" on public.analysis_history;
create policy "Users can read own analysis history"
  on public.analysis_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "service_role_all" on public.promo_codes;
create policy "service_role_all"
  on public.promo_codes
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "team_owner_all" on public.teams;
drop policy if exists "team_member_read" on public.teams;

create policy "team_read"
  on public.teams
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or id in (
      select tm.team_id
      from public.team_members tm
      where tm.user_id = (select auth.uid())
    )
  );

create policy "team_owner_insert"
  on public.teams
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "team_owner_update"
  on public.teams
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "team_owner_delete"
  on public.teams
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "own_membership" on public.team_members;
create policy "own_membership"
  on public.team_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Public trigger functions should not be directly executable by browser roles.
-- Trigger execution is unaffected; this only removes RPC-style direct access.
alter function public.handle_new_user() set search_path = '';
alter function public.update_updated_at() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
