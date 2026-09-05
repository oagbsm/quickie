create or replace function public.force_settle_marketplace_partial_refund(target_booking uuid, settlement_note text)
returns public.marketplace_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  current_booking public.marketplace_bookings;
  target_dispute public.marketplace_disputes;
  settlement_code text := 'admin_force_provider_settlement';
begin
  if not public.is_quickola_admin() then raise exception 'admin_not_allowed'; end if;
  if settlement_note is null or length(trim(settlement_note)) < 5 then raise exception 'settlement_note_required'; end if;

  select b.* into current_booking
  from public.marketplace_bookings as b
  where b.id = target_booking
  for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.payment_status not in ('paid', 'partially_refunded') then raise exception 'booking_not_paid'; end if;
  if coalesce(current_booking.refunded_amount_pence, 0) <= 0 or coalesce(current_booking.refunded_amount_pence, 0) >= coalesce(current_booking.amount_pence, 0) then raise exception 'partial_refund_required'; end if;
  if current_booking.status in ('cancelled', 'completed') then raise exception 'booking_closed'; end if;
  if current_booking.provider_transfer_status = 'paid' or current_booking.stripe_transfer_id is not null then raise exception 'provider_transfer_already_paid'; end if;
  if coalesce(current_booking.amount_pence, 0) - coalesce(current_booking.refunded_amount_pence, 0) <= 0 then raise exception 'remaining_paid_amount_required'; end if;
  if current_booking.payout_hold_status <> 'held' or current_booking.payout_hold_reason not in ('unresolved_dispute', 'customer_issue_reported', 'customer_resolution_refund') then raise exception 'unrelated_payout_hold'; end if;
  if current_booking.provider_transfer_status not in ('pending', 'blocked') then raise exception 'provider_transfer_not_settleable'; end if;

  select d.* into target_dispute
  from public.marketplace_disputes as d
  where d.booking_id = target_booking
    and d.status in ('open', 'in_review', 'resolved_customer')
  order by d.opened_at desc
  limit 1
  for update;
  if target_dispute.id is null then raise exception 'partial_refund_dispute_required'; end if;

  update public.marketplace_disputes as d
    set status = 'resolved_provider', resolved_at = coalesce(d.resolved_at, now()),
        resolved_by_admin_id = auth.uid(), resolution_code = settlement_code,
        resolution_notes = trim(settlement_note)
    where d.id = target_dispute.id;

  update public.marketplace_bookings
    set status = 'completed',
        completion_status = 'completed',
        customer_completed_at = coalesce(customer_completed_at, now()),
        completed_at = coalesce(completed_at, now()),
        payout_hold_status = 'none', payout_hold_reason = null,
        payout_hold_at = null, payout_hold_by = null,
        provider_transfer_status = case when provider_transfer_status = 'blocked' then 'pending' else provider_transfer_status end,
        provider_transfer_error = null, updated_at = now()
    where id = current_booking.id
    returning * into current_booking;

  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
end;
$$;

revoke all on function public.force_settle_marketplace_partial_refund(uuid, text) from public, anon;
grant execute on function public.force_settle_marketplace_partial_refund(uuid, text) to authenticated;
