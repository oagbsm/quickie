-- Additive lifecycle support for marketplace bookings and customer reviews.
alter table public.marketplace_quotes
  add column if not exists scheduled_date date,
  add column if not exists arrival_window_start time,
  add column if not exists arrival_window_end time;

alter table public.marketplace_bookings
  add column if not exists scheduled_date date,
  add column if not exists arrival_window_start time,
  add column if not exists arrival_window_end time,
  add column if not exists provider_arrived_at timestamptz,
  add column if not exists provider_finished_at timestamptz,
  add column if not exists customer_completed_at timestamptz,
  add column if not exists completion_status text not null default 'not_started';

alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_status_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_status_check
  check (status in ('awaiting_booking_fee', 'booked', 'en_route', 'arrived', 'in_progress', 'awaiting_customer_completion', 'completed', 'cancelled'));
alter table public.marketplace_jobs drop constraint if exists marketplace_jobs_status_check;
alter table public.marketplace_jobs add constraint marketplace_jobs_status_check
  check (status in ('posted', 'finding_provider', 'provider_available', 'awaiting_booking', 'booked', 'en_route', 'arrived', 'in_progress', 'awaiting_customer_completion', 'completed', 'cancelled'));
alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_completion_status_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_completion_status_check
  check (completion_status in ('not_started', 'awaiting_customer_completion', 'completed', 'issue_reported'));

create or replace function public.sync_marketplace_booking_schedule()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.marketplace_bookings b
  set scheduled_date = q.scheduled_date,
      arrival_window_start = q.arrival_window_start,
      arrival_window_end = q.arrival_window_end
  from public.marketplace_quotes q
  where b.id = new.id and q.id = new.quote_id;
  return new;
end; $$;
drop trigger if exists marketplace_booking_schedule_sync on public.marketplace_bookings;
create trigger marketplace_booking_schedule_sync after insert or update of quote_id on public.marketplace_bookings
for each row execute function public.sync_marketplace_booking_schedule();

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.marketplace_bookings(id) on delete cascade,
  job_id uuid not null references public.marketplace_jobs(id) on delete cascade,
  customer_id uuid not null references public.marketplace_customers(id) on delete cascade,
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);
alter table public.marketplace_reviews enable row level security;
create policy "marketplace participants view reviews" on public.marketplace_reviews for select to authenticated using (
  customer_id in (select id from public.marketplace_customers where auth_user_id = auth.uid()) or provider_id = auth.uid()
);

create or replace function public.update_marketplace_booking_status(target_booking uuid, next_status text)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  select * into current_booking from public.marketplace_bookings where id = target_booking for update;
  if current_booking.id is null or current_booking.provider_id <> auth.uid() then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if (current_booking.status, next_status) not in (('booked','en_route'), ('en_route','arrived'), ('arrived','in_progress'), ('in_progress','awaiting_customer_completion'), ('arrived','awaiting_customer_completion')) then raise exception 'invalid_booking_transition'; end if;
  update public.marketplace_bookings set
    status = next_status,
    provider_arrived_at = case when next_status = 'arrived' then coalesce(provider_arrived_at, now()) else provider_arrived_at end,
    provider_finished_at = case when next_status = 'awaiting_customer_completion' then coalesce(provider_finished_at, now()) else provider_finished_at end,
    completion_status = case when next_status = 'awaiting_customer_completion' then 'awaiting_customer_completion' else completion_status end,
    updated_at = now()
  where id = target_booking
  returning * into current_booking;
  update public.marketplace_jobs set status = next_status, updated_at = now() where id = current_booking.job_id;
  return current_booking;
end; $$;
revoke all on function public.update_marketplace_booking_status(uuid, text) from public, anon;
grant execute on function public.update_marketplace_booking_status(uuid, text) to authenticated;

create or replace function public.confirm_marketplace_completion(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  select b.* into current_booking from public.marketplace_bookings b join public.marketplace_customers c on c.id = b.customer_id where b.id = target_booking and c.auth_user_id = auth.uid() for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  update public.marketplace_bookings set status = 'completed', completion_status = 'completed', customer_completed_at = coalesce(customer_completed_at, now()), updated_at = now() where id = target_booking returning * into current_booking;
  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
end; $$;
revoke all on function public.confirm_marketplace_completion(uuid) from public, anon;
grant execute on function public.confirm_marketplace_completion(uuid) to authenticated;

create or replace function public.report_marketplace_completion_issue(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  select b.* into current_booking from public.marketplace_bookings b join public.marketplace_customers c on c.id = b.customer_id where b.id = target_booking and c.auth_user_id = auth.uid() for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  update public.marketplace_bookings set completion_status = 'issue_reported', updated_at = now() where id = target_booking returning * into current_booking;
  return current_booking;
end; $$;
revoke all on function public.report_marketplace_completion_issue(uuid) from public, anon;
grant execute on function public.report_marketplace_completion_issue(uuid) to authenticated;

create or replace function public.submit_marketplace_review(target_booking uuid, review_rating integer, review_body text default null)
returns public.marketplace_reviews language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings; result public.marketplace_reviews;
begin
  select b.* into current_booking from public.marketplace_bookings b join public.marketplace_customers c on c.id = b.customer_id where b.id = target_booking and c.auth_user_id = auth.uid() for update;
  if current_booking.id is null or current_booking.status <> 'completed' then raise exception 'review_not_allowed'; end if;
  if review_rating < 1 or review_rating > 5 then raise exception 'invalid_rating'; end if;
  insert into public.marketplace_reviews(booking_id, job_id, customer_id, provider_id, rating, review_text)
  values (current_booking.id, current_booking.job_id, current_booking.customer_id, current_booking.provider_id, review_rating, nullif(trim(review_body), ''))
  returning * into result;
  return result;
exception when unique_violation then raise exception 'review_already_submitted';
end; $$;
revoke all on function public.submit_marketplace_review(uuid, integer, text) from public, anon;
grant execute on function public.submit_marketplace_review(uuid, integer, text) to authenticated;
