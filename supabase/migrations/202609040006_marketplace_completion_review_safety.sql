-- Tighten completion/review/dispute invariants after the booking operations layer.
-- This migration is additive and preserves existing booking and review rows.

alter table public.marketplace_bookings
  add column if not exists completed_at timestamptz;

create unique index if not exists marketplace_reviews_one_per_booking_idx
  on public.marketplace_reviews(booking_id);

create or replace function public.confirm_marketplace_completion_with_review(
  target_booking uuid,
  review_rating integer,
  review_body text default null
)
returns public.marketplace_bookings
language plpgsql
security definer
set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  if review_rating is null or review_rating < 1 or review_rating > 5 then raise exception 'invalid_rating'; end if;
  select b.* into current_booking
  from public.marketplace_bookings b
  join public.marketplace_customers c on c.id = b.customer_id
  where b.id = target_booking and c.auth_user_id = auth.uid()
  for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if current_booking.status <> 'awaiting_customer_completion' or current_booking.completion_status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  if current_booking.payout_hold_status = 'held' or current_booking.refunded_amount_pence > 0 then raise exception 'completion_blocked'; end if;
  if exists (select 1 from public.marketplace_disputes d where d.booking_id = current_booking.id and d.status in ('open', 'in_review', 'resolved_customer')) then raise exception 'completion_disputed'; end if;
  if current_booking.provider_id is null then raise exception 'provider_not_selected'; end if;

  insert into public.marketplace_reviews(booking_id, job_id, customer_id, provider_id, rating, review_text)
    values (current_booking.id, current_booking.job_id, current_booking.customer_id, current_booking.provider_id, review_rating, nullif(trim(review_body), ''));
  update public.marketplace_bookings set
    status = 'completed', completion_status = 'completed',
    customer_completed_at = coalesce(customer_completed_at, now()),
    completed_at = coalesce(completed_at, now()), updated_at = now()
    where id = current_booking.id returning * into current_booking;
  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
exception when unique_violation then
  raise exception 'review_already_submitted';
end;
$$;

revoke all on function public.confirm_marketplace_completion_with_review(uuid, integer, text) from public, anon;
grant execute on function public.confirm_marketplace_completion_with_review(uuid, integer, text) to authenticated;

-- The old no-reason RPC remains defined for migration compatibility but is no
-- longer callable by authenticated clients. New callers must use the reasoned
-- dispute path below.
revoke execute on function public.report_marketplace_completion_issue(uuid) from authenticated;

create or replace function public.report_marketplace_completion_issue(
  target_booking uuid,
  reason_code text,
  reason_text text
)
returns public.marketplace_bookings
language plpgsql
security definer
set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  if nullif(trim(reason_code), '') is null or nullif(trim(reason_text), '') is null then raise exception 'dispute_details_required'; end if;
  select b.* into current_booking
  from public.marketplace_bookings b
  join public.marketplace_customers c on c.id = b.customer_id
  where b.id = target_booking and c.auth_user_id = auth.uid()
  for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if current_booking.status <> 'awaiting_customer_completion' or current_booking.completion_status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  if current_booking.payout_hold_status = 'held' then raise exception 'completion_disputed'; end if;
  if exists (select 1 from public.marketplace_disputes d where d.booking_id = current_booking.id and d.status in ('open', 'in_review')) then raise exception 'active_dispute_exists'; end if;

  insert into public.marketplace_disputes(booking_id, opened_by_user_id, opened_by_type, reason_code, description)
    values (current_booking.id, auth.uid(), 'customer', trim(reason_code), trim(reason_text));
  update public.marketplace_bookings set
    completion_status = 'issue_reported', provider_transfer_status = 'blocked',
    provider_transfer_error = 'customer_issue_reported', payout_hold_status = 'held',
    payout_hold_reason = 'unresolved_dispute', payout_hold_at = now(), payout_hold_by = auth.uid(),
    completion_issue_reported_at = coalesce(completion_issue_reported_at, now()), updated_at = now()
    where id = current_booking.id returning * into current_booking;
  return current_booking;
exception when unique_violation then
  raise exception 'active_dispute_exists';
end;
$$;

revoke all on function public.report_marketplace_completion_issue(uuid, text, text) from public, anon;
grant execute on function public.report_marketplace_completion_issue(uuid, text, text) to authenticated;

-- Resolution outcomes must leave the booking in a state consistent with the
-- financial outcome. A provider-win resolution is the only admin path that
-- releases the hold and makes an eligible paid booking payable.
create or replace function public.resolve_marketplace_dispute(target_dispute uuid, resolution_status text, resolution_code text, resolution_notes text default null)
returns public.marketplace_disputes language plpgsql security definer set search_path = public
as $$
declare result public.marketplace_disputes; current_booking public.marketplace_bookings;
begin
  if not public.is_quickola_admin() then raise exception 'admin_not_allowed'; end if;
  if resolution_status not in ('resolved_provider', 'resolved_customer', 'closed') then raise exception 'invalid_resolution'; end if;
  update public.marketplace_disputes set status = resolution_status, resolved_at = coalesce(resolved_at, now()), resolved_by_admin_id = auth.uid(), resolution_code = nullif(trim(resolution_code), ''), resolution_notes = nullif(trim(resolution_notes), '') where id = target_dispute and status in ('open', 'in_review') returning * into result;
  if result.id is null then raise exception 'dispute_not_found'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.id = result.booking_id for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if resolution_status = 'resolved_provider' then
    if current_booking.payment_status <> 'paid' or current_booking.status in ('cancelled', 'completed') then raise exception 'payout_not_eligible'; end if;
    update public.marketplace_bookings set status = 'completed', completion_status = 'completed', customer_completed_at = coalesce(customer_completed_at, now()), completed_at = coalesce(completed_at, now()), payout_hold_status = 'none', payout_hold_reason = null, updated_at = now() where id = current_booking.id;
    update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  elsif resolution_status = 'resolved_customer' then
    if current_booking.payment_status in ('refunded', 'cancelled') then raise exception 'booking_not_refundable'; end if;
    update public.marketplace_bookings set payment_status = case when payment_status = 'paid' then 'refund_pending' else payment_status end, payout_hold_status = 'held', payout_hold_reason = 'customer_resolution_refund', payout_hold_at = now(), updated_at = now() where id = current_booking.id;
  end if;
  return result;
end;
$$;

revoke all on function public.resolve_marketplace_dispute(uuid, text, text, text) from public, anon;
grant execute on function public.resolve_marketplace_dispute(uuid, text, text, text) to authenticated;
