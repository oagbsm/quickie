-- Atomic pre-payment provider switching and customer cancellation.
create or replace function public.change_marketplace_selected_quote(target_quote uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public as $$
declare target_job public.marketplace_jobs; chosen public.marketplace_quotes; current_booking public.marketplace_bookings;
begin
  select j.* into target_job from public.marketplace_jobs j join public.marketplace_quotes q on q.job_id=j.id join public.marketplace_customers c on c.id=j.customer_id where q.id=target_quote and c.auth_user_id=auth.uid() for update of j;
  if target_job.id is null or target_job.status in ('cancelled','completed') then raise exception 'job_not_available'; end if;
  select q.* into chosen from public.marketplace_quotes q where q.id=target_quote and q.job_id=target_job.id and q.status in ('pending','submitted','accepted','selected');
  if chosen.id is null then raise exception 'offer_not_available'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.job_id=target_job.id for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.payment_status='paid' then raise exception 'booking_paid'; end if;
  if current_booking.status in ('cancelled','completed') or current_booking.payment_status in ('refunded','refund_pending','partially_refunded') then raise exception 'booking_locked'; end if;
  update public.marketplace_quotes set status=case when id=chosen.id then 'accepted' else 'declined' end, updated_at=now() where job_id=target_job.id and status in ('pending','submitted','selected','accepted');
  update public.marketplace_bookings set quote_id=chosen.id, provider_id=coalesce(chosen.provider_id,chosen.bidder_user_id), quoted_service_price_pence=chosen.amount_pence, amount_pence=chosen.amount_pence, platform_fee_pence=floor(chosen.amount_pence*0.10), stripe_checkout_session_id=null, stripe_payment_intent_id=null, paid_at=null, cancelled_at=null, payment_status='pending_payment', status='awaiting_booking_fee', updated_at=now() where id=current_booking.id returning * into current_booking;
  update public.marketplace_jobs set status='awaiting_booking', updated_at=now() where id=target_job.id;
  return current_booking;
end; $$;

create or replace function public.cancel_marketplace_job_before_payment(target_job uuid, reason_text text default null)
returns public.marketplace_bookings language plpgsql security definer set search_path = public as $$
declare current_job public.marketplace_jobs; current_booking public.marketplace_bookings;
begin
  select j.* into current_job from public.marketplace_jobs j join public.marketplace_customers c on c.id=j.customer_id where j.id=target_job and c.auth_user_id=auth.uid() for update of j;
  if current_job.id is null then raise exception 'job_not_allowed'; end if;
  if current_job.status in ('completed','cancelled') then raise exception 'job_not_cancellable'; end if;
  select b.* into current_booking from public.marketplace_bookings b where b.job_id=current_job.id for update;
  if current_booking.id is null then raise exception 'booking_not_found'; end if;
  if current_booking.payment_status='paid' then raise exception 'booking_paid'; end if;
  if current_booking.payment_status in ('refunded','refund_pending','partially_refunded') then raise exception 'booking_locked'; end if;
  update public.marketplace_bookings set status='cancelled', payment_status='cancelled', stripe_checkout_session_id=null, stripe_payment_intent_id=null, cancelled_at=coalesce(cancelled_at,now()), cancelled_by_type='customer', cancelled_by_user_id=auth.uid(), cancellation_reason_code='customer_pre_payment', cancellation_reason_text=nullif(trim(reason_text),''), payout_hold_status='held', payout_hold_reason='booking_cancelled_before_payment', payout_hold_at=now(), payout_hold_by=auth.uid(), updated_at=now() where id=current_booking.id returning * into current_booking;
  update public.marketplace_quotes set status=case when status in ('accepted','selected','pending','submitted') then 'declined' else status end, updated_at=now() where job_id=current_job.id;
  update public.marketplace_jobs set status='cancelled', updated_at=now() where id=current_job.id;
  return current_booking;
end; $$;

revoke all on function public.change_marketplace_selected_quote(uuid) from public, anon;
grant execute on function public.change_marketplace_selected_quote(uuid) to authenticated;
revoke all on function public.cancel_marketplace_job_before_payment(uuid, text) from public, anon;
grant execute on function public.cancel_marketplace_job_before_payment(uuid, text) to authenticated;
