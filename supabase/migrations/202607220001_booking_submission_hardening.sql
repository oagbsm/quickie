-- P0: make customer booking creation idempotent and remove broad customer mutations.

alter table public.business_bookings
  add column if not exists idempotency_key uuid;

create unique index if not exists business_bookings_account_idempotency_idx
  on public.business_bookings(account_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.booking_events (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  booking_id uuid not null references public.business_bookings(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_created_idx
  on public.booking_events(booking_id, created_at);

alter table public.booking_events enable row level security;
drop policy if exists "members view booking events" on public.booking_events;
create policy "members view booking events" on public.booking_events
  for select to authenticated using (public.is_business_member(account_id));
drop policy if exists "admins view booking events" on public.booking_events;
create policy "admins view booking events" on public.booking_events
  for select to authenticated using (public.is_quickola_admin());

-- The original migration allowed customers to mutate every booking field.
drop policy if exists "members manage bookings" on public.business_bookings;
drop policy if exists "members request bookings" on public.business_bookings;
drop policy if exists "members request canonical bookings" on public.business_bookings;
drop policy if exists "members view bookings" on public.business_bookings;
create policy "members view bookings" on public.business_bookings
  for select to authenticated using (public.is_business_member(account_id));

create or replace function public.server_create_business_booking(payload jsonb)
returns public.business_bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.business_bookings;
  request_key uuid;
begin
  request_key := (payload->>'idempotency_key')::uuid;

  select * into result
  from public.business_bookings
  where account_id = (payload->>'account_id')::uuid
    and idempotency_key = request_key;

  if result.id is not null then
    return result;
  end if;

  insert into public.business_bookings (
    account_id, property_id, service, scheduled_start, requirements,
    recurrence, extras, status, pricing_version, pricing_mode,
    pricing_breakdown, estimated_price_pence, estimated_price_max_pence,
    duration_minutes, requires_manual_review, customer_price_accepted,
    customer_price_accepted_at, idempotency_key
  ) values (
    (payload->>'account_id')::uuid,
    (payload->>'property_id')::uuid,
    payload->>'service',
    (payload->>'scheduled_start')::timestamptz,
    nullif(payload->>'requirements', ''),
    payload->>'recurrence',
    coalesce(payload->'extras', '[]'::jsonb),
    payload->>'status',
    payload->>'pricing_version',
    payload->>'pricing_mode',
    payload->'pricing_breakdown',
    (payload->>'estimated_price_pence')::integer,
    nullif(payload->>'estimated_price_max_pence', '')::integer,
    (payload->>'duration_minutes')::integer,
    (payload->>'requires_manual_review')::boolean,
    (payload->>'customer_price_accepted')::boolean,
    nullif(payload->>'customer_price_accepted_at', '')::timestamptz,
    request_key
  )
  returning * into result;

  insert into public.booking_events(account_id, booking_id, event_type, actor_user_id, metadata)
  values (
    result.account_id,
    result.id,
    'booking_requested',
    nullif(payload->>'actor_user_id', '')::uuid,
    jsonb_build_object('status', result.status, 'pricing_version', result.pricing_version)
  );

  return result;
exception
  when unique_violation then
    select * into result
    from public.business_bookings
    where account_id = (payload->>'account_id')::uuid
      and idempotency_key = request_key;
    return result;
end;
$$;

revoke all on function public.server_create_business_booking(jsonb) from public, anon, authenticated;
grant execute on function public.server_create_business_booking(jsonb) to service_role;
