-- Additive marketplace operations safety state. This migration does not remove
-- existing rows or change the Stripe charge/transfer architecture.
alter table public.marketplace_bookings
  add column if not exists cancelled_by_type text,
  add column if not exists cancelled_by_user_id uuid,
  add column if not exists cancellation_reason_code text,
  add column if not exists cancellation_reason_text text,
  add column if not exists refunded_amount_pence bigint not null default 0,
  add column if not exists payout_hold_status text not null default 'none',
  add column if not exists payout_hold_reason text,
  add column if not exists payout_hold_at timestamptz,
  add column if not exists payout_hold_by uuid;

alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_payment_status_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_payment_status_check
  check (payment_status in ('pending_payment', 'paid', 'cancelled', 'refund_pending', 'partially_refunded', 'refunded'));
alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_payout_hold_status_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_payout_hold_status_check
  check (payout_hold_status in ('none', 'held'));
alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_refunded_amount_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_refunded_amount_check
  check (refunded_amount_pence >= 0 and (amount_pence is null or refunded_amount_pence <= amount_pence));

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  received_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  error_message text
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create table if not exists public.marketplace_refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.marketplace_bookings(id) on delete restrict,
  stripe_refund_id text unique,
  stripe_payment_intent_id text,
  amount_pence bigint not null check (amount_pence > 0),
  currency text not null default 'gbp',
  refund_type text not null check (refund_type in ('full', 'partial')),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  requested_by_admin_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  failure_reason text
);
create index if not exists marketplace_refunds_booking_idx on public.marketplace_refunds(booking_id, created_at desc);
create unique index if not exists marketplace_refunds_one_pending_idx on public.marketplace_refunds(booking_id) where status = 'pending';
alter table public.marketplace_refunds enable row level security;
revoke all on public.marketplace_refunds from anon, authenticated;

create table if not exists public.marketplace_disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.marketplace_bookings(id) on delete restrict,
  opened_by_user_id uuid not null references auth.users(id),
  opened_by_type text not null check (opened_by_type in ('customer', 'provider', 'admin')),
  reason_code text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved_provider', 'resolved_customer', 'closed')),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_admin_id uuid references auth.users(id),
  resolution_code text,
  resolution_notes text
);
create unique index if not exists marketplace_disputes_one_active_per_booking_idx
  on public.marketplace_disputes(booking_id) where status in ('open', 'in_review');
create index if not exists marketplace_disputes_status_idx on public.marketplace_disputes(status, opened_at desc);
alter table public.marketplace_disputes enable row level security;
create policy "marketplace participants view own disputes" on public.marketplace_disputes for select to authenticated using (
  opened_by_user_id = auth.uid()
  or exists (select 1 from public.marketplace_bookings b where b.id = booking_id and (b.provider_id = auth.uid() or exists (select 1 from public.marketplace_customers c where c.id = b.customer_id and c.auth_user_id = auth.uid())))
  or public.is_quickola_admin()
);

create or replace function public.cancel_marketplace_booking(target_booking uuid, reason_code text, reason_text text default null)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings; actor_type text;
begin
  if nullif(trim(reason_code), '') is null then raise exception 'cancellation_reason_required'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.id = target_booking for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.status in ('completed', 'cancelled') or current_booking.payment_status = 'refunded' then raise exception 'booking_not_cancellable'; end if;
  if current_booking.customer_id in (select c.id from public.marketplace_customers c where c.auth_user_id = auth.uid()) then actor_type := 'customer';
  elsif current_booking.provider_id = auth.uid() then actor_type := 'provider';
  elsif public.is_quickola_admin() then actor_type := 'admin';
  else raise exception 'booking_not_allowed'; end if;
  update public.marketplace_bookings set status = 'cancelled', payment_status = case when payment_status = 'paid' then 'refund_pending' else 'cancelled' end,
    cancelled_at = coalesce(cancelled_at, now()), cancelled_by_type = actor_type, cancelled_by_user_id = auth.uid(),
    cancellation_reason_code = trim(reason_code), cancellation_reason_text = nullif(trim(reason_text), ''),
    payout_hold_status = 'held', payout_hold_reason = 'booking_cancelled', payout_hold_at = now(), payout_hold_by = auth.uid(), updated_at = now()
    where id = target_booking returning * into current_booking;
  return current_booking;
end; $$;
revoke all on function public.cancel_marketplace_booking(uuid, text, text) from public, anon;
grant execute on function public.cancel_marketplace_booking(uuid, text, text) to authenticated;

create or replace function public.open_marketplace_dispute(target_booking uuid, reason_code text, description text)
returns public.marketplace_disputes language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings; result public.marketplace_disputes; actor_type text;
begin
  if nullif(trim(reason_code), '') is null or nullif(trim(description), '') is null then raise exception 'dispute_details_required'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.id = target_booking for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.customer_id in (select c.id from public.marketplace_customers c where c.auth_user_id = auth.uid()) then actor_type := 'customer';
  elsif current_booking.provider_id = auth.uid() then actor_type := 'provider';
  else raise exception 'booking_not_allowed'; end if;
  insert into public.marketplace_disputes(booking_id, opened_by_user_id, opened_by_type, reason_code, description)
    values (target_booking, auth.uid(), actor_type, trim(reason_code), trim(description)) returning * into result;
  update public.marketplace_bookings set payout_hold_status = 'held', payout_hold_reason = 'unresolved_dispute', payout_hold_at = now(), payout_hold_by = auth.uid(), updated_at = now() where id = target_booking;
  return result;
exception when unique_violation then raise exception 'active_dispute_exists';
end; $$;
revoke all on function public.open_marketplace_dispute(uuid, text, text) from public, anon;
grant execute on function public.open_marketplace_dispute(uuid, text, text) to authenticated;

create or replace function public.claim_stripe_webhook_event(target_event_id text, target_event_type text)
returns text language plpgsql security definer set search_path = public
as $$
declare current_status text;
begin
  insert into public.stripe_webhook_events(stripe_event_id, event_type, processing_started_at)
    values (target_event_id, target_event_type, now()) on conflict (stripe_event_id) do nothing;
  select status into current_status from public.stripe_webhook_events where stripe_event_id = target_event_id for update;
  if current_status = 'failed' then
    update public.stripe_webhook_events set status = 'processing', processing_started_at = now(), error_message = null where stripe_event_id = target_event_id;
    return 'claimed';
  end if;
  return case when current_status = 'processing' then 'duplicate_processing' when current_status = 'processed' then 'duplicate_processed' else 'claimed' end;
end; $$;
revoke all on function public.claim_stripe_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text) to service_role;

create or replace function public.release_marketplace_payout_hold(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  if not public.is_quickola_admin() then raise exception 'admin_not_allowed'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.id = target_booking for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.status = 'cancelled' or current_booking.payment_status in ('refunded', 'refund_pending') then raise exception 'payout_not_eligible'; end if;
  if exists (select 1 from public.marketplace_disputes d where d.booking_id = target_booking and d.status in ('open', 'in_review', 'resolved_customer')) then raise exception 'payout_dispute_blocked'; end if;
  update public.marketplace_bookings set payout_hold_status = 'none', payout_hold_reason = null, updated_at = now() where id = target_booking returning * into current_booking;
  return current_booking;
end; $$;
revoke all on function public.release_marketplace_payout_hold(uuid) from public, anon;
grant execute on function public.release_marketplace_payout_hold(uuid) to authenticated;

create or replace function public.resolve_marketplace_dispute(target_dispute uuid, resolution_status text, resolution_code text, resolution_notes text default null)
returns public.marketplace_disputes language plpgsql security definer set search_path = public
as $$
declare result public.marketplace_disputes;
begin
  if not public.is_quickola_admin() then raise exception 'admin_not_allowed'; end if;
  if resolution_status not in ('resolved_provider', 'resolved_customer', 'closed') then raise exception 'invalid_resolution'; end if;
  update public.marketplace_disputes set status = resolution_status, resolved_at = coalesce(resolved_at, now()), resolved_by_admin_id = auth.uid(), resolution_code = nullif(trim(resolution_code), ''), resolution_notes = nullif(trim(resolution_notes), '') where id = target_dispute and status in ('open', 'in_review') returning * into result;
  if result.id is null then raise exception 'dispute_not_found'; end if;
  if resolution_status = 'resolved_provider' or resolution_status = 'closed' then
    update public.marketplace_bookings set payout_hold_status = case when exists (select 1 from public.marketplace_disputes d where d.booking_id = result.booking_id and d.status in ('open', 'in_review', 'resolved_customer')) then 'held' else 'none' end, payout_hold_reason = case when exists (select 1 from public.marketplace_disputes d where d.booking_id = result.booking_id and d.status in ('open', 'in_review', 'resolved_customer')) then payout_hold_reason else null end, updated_at = now() where id = result.booking_id;
  end if;
  return result;
end; $$;
revoke all on function public.resolve_marketplace_dispute(uuid, text, text, text) from public, anon;
grant execute on function public.resolve_marketplace_dispute(uuid, text, text, text) to authenticated;
