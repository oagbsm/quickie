-- Customer completion is independent from the optional review submission.
create or replace function public.confirm_marketplace_completion(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public as $$
declare current_booking public.marketplace_bookings;
begin
  select b.* into current_booking from public.marketplace_bookings b join public.marketplace_customers c on c.id = b.customer_id where b.id = target_booking and c.auth_user_id = auth.uid() for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if current_booking.status = 'completed' and current_booking.completion_status = 'completed' then return current_booking; end if;
  if current_booking.status <> 'awaiting_customer_completion' or current_booking.completion_status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  if current_booking.payout_hold_status = 'held' or current_booking.refunded_amount_pence > 0 then raise exception 'completion_blocked'; end if;
  if exists (select 1 from public.marketplace_disputes d where d.booking_id = current_booking.id and d.status in ('open', 'in_review', 'resolved_customer')) then raise exception 'completion_disputed'; end if;
  update public.marketplace_bookings set status = 'completed', completion_status = 'completed', customer_completed_at = coalesce(customer_completed_at, now()), completed_at = coalesce(completed_at, now()), updated_at = now() where id = current_booking.id returning * into current_booking;
  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
end; $$;
revoke all on function public.confirm_marketplace_completion(uuid) from public, anon;
grant execute on function public.confirm_marketplace_completion(uuid) to authenticated;
