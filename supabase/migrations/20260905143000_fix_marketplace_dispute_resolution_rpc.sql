-- Fix PL/pgSQL parameter/column name collisions in the dispute-resolution RPC.
drop function if exists public.resolve_marketplace_dispute(uuid, text, text, text);

create or replace function public.resolve_marketplace_dispute(
  target_dispute uuid,
  p_resolution_status text,
  p_resolution_code text,
  p_resolution_notes text default null
)
returns public.marketplace_disputes
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.marketplace_disputes;
  current_booking public.marketplace_bookings;
begin
  if not public.is_quickola_admin() then raise exception 'admin_not_allowed'; end if;
  if p_resolution_status not in ('resolved_provider', 'resolved_customer') then raise exception 'invalid_resolution'; end if;

  select d.* into result
  from public.marketplace_disputes as d
  where d.id = target_dispute and d.status in ('open', 'in_review')
  for update;
  if result.id is null then raise exception 'dispute_not_found'; end if;

  select b.* into current_booking
  from public.marketplace_bookings as b
  where b.id = result.booking_id
  for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;

  if p_resolution_status = 'resolved_provider' then
    if current_booking.payment_status <> 'paid'
       or current_booking.status in ('cancelled', 'completed')
       or current_booking.completion_status = 'completed' then
      raise exception 'booking_not_eligible_to_continue';
    end if;
    if current_booking.payout_hold_status = 'held'
       and current_booking.payout_hold_reason <> 'unresolved_dispute' then
      raise exception 'unrelated_payout_hold';
    end if;

    update public.marketplace_disputes as d
      set status = 'resolved_provider', resolved_at = coalesce(d.resolved_at, now()),
          resolved_by_admin_id = auth.uid(), resolution_code = nullif(trim(p_resolution_code), ''),
          resolution_notes = nullif(trim(p_resolution_notes), '')
      where d.id = result.id
      returning d.* into result;

    update public.marketplace_bookings
      set status = 'awaiting_customer_completion',
          completion_status = 'awaiting_customer_completion',
          payout_hold_status = case when current_booking.payout_hold_reason = 'unresolved_dispute' then 'none' else current_booking.payout_hold_status end,
          payout_hold_reason = case when current_booking.payout_hold_reason = 'unresolved_dispute' then null else current_booking.payout_hold_reason end,
          payout_hold_at = case when current_booking.payout_hold_reason = 'unresolved_dispute' then null else current_booking.payout_hold_at end,
          payout_hold_by = case when current_booking.payout_hold_reason = 'unresolved_dispute' then null else current_booking.payout_hold_by end,
          provider_transfer_status = case when current_booking.provider_transfer_status = 'blocked' and current_booking.provider_transfer_error = 'customer_issue_reported' then 'pending' else current_booking.provider_transfer_status end,
          provider_transfer_error = case when current_booking.provider_transfer_status = 'blocked' and current_booking.provider_transfer_error = 'customer_issue_reported' then null else current_booking.provider_transfer_error end,
          updated_at = now()
      where id = current_booking.id;
    update public.marketplace_jobs set status = 'awaiting_customer_completion', updated_at = now() where id = current_booking.job_id;
  else
    if current_booking.payment_status in ('refunded', 'cancelled') then raise exception 'booking_not_refundable'; end if;

    update public.marketplace_disputes as d
      set status = 'resolved_customer', resolved_at = coalesce(d.resolved_at, now()),
          resolved_by_admin_id = auth.uid(), resolution_code = nullif(trim(p_resolution_code), ''),
          resolution_notes = nullif(trim(p_resolution_notes), '')
      where d.id = result.id
      returning d.* into result;

    update public.marketplace_bookings
      set payment_status = case when current_booking.payment_status = 'paid' then 'refund_pending' else current_booking.payment_status end,
          completion_status = 'issue_reported',
          provider_transfer_status = 'blocked',
          provider_transfer_error = 'customer_refund_pending',
          payout_hold_status = 'held', payout_hold_reason = 'customer_resolution_refund',
          payout_hold_at = now(), updated_at = now()
      where id = current_booking.id;
  end if;
  return result;
end;
$$;

revoke all on function public.resolve_marketplace_dispute(uuid, text, text, text) from public, anon;
grant execute on function public.resolve_marketplace_dispute(uuid, text, text, text) to authenticated;
