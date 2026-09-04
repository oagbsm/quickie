-- Atomically confirm customer completion and save the required review.
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
declare
  current_booking public.marketplace_bookings;
  existing_review public.marketplace_reviews;
begin
  if review_rating is null or review_rating < 1 or review_rating > 5 then raise exception 'invalid_rating'; end if;
  select b.* into current_booking from public.marketplace_bookings b
    join public.marketplace_customers c on c.id = b.customer_id
    where b.id = target_booking and c.auth_user_id = auth.uid() for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.status = 'completed' then
    select r.* into existing_review from public.marketplace_reviews r where r.booking_id = target_booking;
    if existing_review.id is not null then return current_booking; end if;
    raise exception 'review_required';
  end if;
  if current_booking.status <> 'awaiting_customer_completion'
     or current_booking.completion_status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  insert into public.marketplace_reviews(booking_id, job_id, customer_id, provider_id, rating, review_text)
    values (current_booking.id, current_booking.job_id, current_booking.customer_id, current_booking.provider_id,
      review_rating, nullif(trim(review_body), ''));
  update public.marketplace_bookings set status = 'completed', completion_status = 'completed',
    customer_completed_at = coalesce(customer_completed_at, now()), updated_at = now()
    where id = target_booking returning * into current_booking;
  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
exception when unique_violation then
  select b.* into current_booking from public.marketplace_bookings b where b.id = target_booking;
  if current_booking.id is not null and current_booking.status = 'completed'
     and exists (select 1 from public.marketplace_reviews r where r.booking_id = target_booking) then return current_booking; end if;
  raise exception 'review_already_submitted';
end;
$$;

revoke all on function public.confirm_marketplace_completion_with_review(uuid, integer, text) from public, anon;
grant execute on function public.confirm_marketplace_completion_with_review(uuid, integer, text) to authenticated;
