-- Allow an unpaid booking to be returned to quote selection when its provider
-- withdraws. The booking row is retained for history and future reselection.
alter table public.marketplace_bookings
  alter column quote_id drop not null,
  alter column provider_id drop not null;

create or replace function public.withdraw_marketplace_quote(target_job uuid)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  current_job public.marketplace_jobs;
  result public.marketplace_quotes;
  current_booking public.marketplace_bookings;
begin
  select j.* into current_job
  from public.marketplace_jobs j
  join public.marketplace_quotes q on q.job_id = j.id
  where j.id = target_job
    and coalesce(q.provider_id, q.bidder_user_id) = auth.uid()
  for update of j;
  if current_job.id is null then raise exception 'offer_not_found'; end if;

  select q.* into result
  from public.marketplace_quotes q
  where q.job_id = target_job
    and coalesce(q.provider_id, q.bidder_user_id) = auth.uid()
  for update;
  if result.id is null then raise exception 'offer_not_found'; end if;
  if current_job.status in ('cancelled', 'completed') then raise exception 'offer_locked_after_completion'; end if;
  if result.status not in ('pending', 'submitted', 'accepted', 'selected') then raise exception 'offer_not_active'; end if;

  select b.* into current_booking
  from public.marketplace_bookings b
  where b.job_id = target_job
  for update;
  if current_booking.id is not null then
    if current_booking.payment_status = 'paid' then raise exception 'offer_locked_after_payment'; end if;
    if current_booking.status in ('cancelled', 'completed') or current_booking.payment_status in ('refunded', 'refund_pending', 'partially_refunded') then
      raise exception 'offer_locked';
    end if;
  end if;

  insert into public.marketplace_quote_history(
    quote_id, job_id, provider_user_id, amount_pence, availability_text, message, status
  ) values (
    result.id, result.job_id, auth.uid(), result.amount_pence, result.availability_text, result.message, 'withdrawn'
  );
  update public.marketplace_quotes
  set status = 'withdrawn', updated_at = now()
  where id = result.id
  returning * into result;

  if current_booking.id is not null and current_booking.quote_id = result.id then
    update public.marketplace_bookings
    set quote_id = null,
        provider_id = null,
        payment_status = 'pending_payment',
        status = 'awaiting_booking_fee',
        stripe_checkout_session_id = null,
        stripe_checkout_attempt_id = null,
        stripe_payment_intent_id = null,
        paid_at = null,
        updated_at = now()
    where id = current_booking.id;
    update public.marketplace_jobs set status = 'finding_provider', updated_at = now() where id = current_job.id;
  end if;
  return result;
end;
$$;

revoke all on function public.withdraw_marketplace_quote(uuid) from public, anon;
grant execute on function public.withdraw_marketplace_quote(uuid) to authenticated;
