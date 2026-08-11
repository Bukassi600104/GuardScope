-- GuardScope paid-product foundation.
-- Additive and safe to deploy before Paystack credentials are configured.

alter table public.users add column if not exists access_plan text not null default 'trial';
alter table public.users add column if not exists subscription_status text not null default 'trialing';
alter table public.users add column if not exists trial_scans_used integer not null default 0;
alter table public.users add column if not exists trial_scan_limit integer not null default 5;
alter table public.users add column if not exists payment_provider text;
alter table public.users add column if not exists paystack_subscription_code text;
alter table public.users add column if not exists paystack_plan_code text;
alter table public.users add column if not exists current_period_start timestamptz;
alter table public.users add column if not exists current_period_end timestamptz;
alter table public.users add column if not exists next_payment_at timestamptz;
alter table public.users add column if not exists cancel_at_period_end boolean not null default false;
alter table public.users add column if not exists last_payment_at timestamptz;
alter table public.users add column if not exists last_payment_failed_at timestamptz;
alter table public.users add column if not exists billing_updated_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_access_plan_check') then
    alter table public.users add constraint users_access_plan_check
      check (access_plan in ('trial', 'pro', 'team'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_subscription_status_check') then
    alter table public.users add constraint users_subscription_status_check
      check (subscription_status in ('trialing', 'active', 'past_due', 'non_renewing', 'attention', 'completed', 'canceled', 'unpaid', 'paused'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_trial_scans_used_check') then
    alter table public.users add constraint users_trial_scans_used_check
      check (trial_scans_used >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_trial_scan_limit_check') then
    alter table public.users add constraint users_trial_scan_limit_check
      check (trial_scan_limit between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_payment_provider_check') then
    alter table public.users add constraint users_payment_provider_check
      check (payment_provider is null or payment_provider = 'paystack');
  end if;
end $$;

update public.users
set
  access_plan = case when tier = 'team' then 'team' when tier = 'pro' then 'pro' else 'trial' end,
  subscription_status = case when tier in ('pro', 'team') then 'active' else 'trialing' end,
  trial_scans_used = case
    when tier in ('pro', 'team') then trial_scans_used
    else least(trial_scan_limit, coalesce((
      select sum(u.analysis_count)::integer from public.usage u where u.user_id = users.id
    ), 0))
  end;

create unique index if not exists users_paystack_customer_code_uidx
  on public.users (paystack_customer_code) where paystack_customer_code is not null;
create unique index if not exists users_paystack_subscription_code_uidx
  on public.users (paystack_subscription_code) where paystack_subscription_code is not null;
create index if not exists users_subscription_status_idx
  on public.users (subscription_status);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'paystack'),
  event_key text not null,
  event_type text not null,
  payload_sha256 text not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_key)
);

alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from anon, authenticated;
create index if not exists payment_webhook_events_status_received_idx
  on public.payment_webhook_events (processing_status, received_at desc);

create or replace function public.consume_trial_scan(target_user_id uuid)
returns table (allowed boolean, scans_used integer, scan_limit integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_row public.users%rowtype;
begin
  select * into current_user_row
  from public.users
  where id = target_user_id
  for update;

  if not found then
    return query select false, 0, 5;
    return;
  end if;

  if current_user_row.access_plan in ('pro', 'team')
     and current_user_row.subscription_status in ('active', 'non_renewing') then
    return query select true, current_user_row.trial_scans_used, current_user_row.trial_scan_limit;
    return;
  end if;

  if current_user_row.trial_scans_used >= current_user_row.trial_scan_limit then
    return query select false, current_user_row.trial_scans_used, current_user_row.trial_scan_limit;
    return;
  end if;

  update public.users
  set trial_scans_used = trial_scans_used + 1
  where id = target_user_id
  returning users.trial_scans_used, users.trial_scan_limit
  into current_user_row.trial_scans_used, current_user_row.trial_scan_limit;

  return query select true, current_user_row.trial_scans_used, current_user_row.trial_scan_limit;
end;
$$;

revoke execute on function public.consume_trial_scan(uuid) from public, anon, authenticated;
grant execute on function public.consume_trial_scan(uuid) to service_role;
