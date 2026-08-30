-- Sandbox marketplace payment settlement: retain the platform charge and
-- transfer the stored provider share only after customer confirmation.
alter table public.marketplace_bookings
  add column if not exists provider_transfer_status text not null default 'pending',
  add column if not exists provider_transfer_amount_pence bigint,
  add column if not exists stripe_transfer_id text,
  add column if not exists provider_transferred_at timestamptz,
  add column if not exists provider_transfer_error text,
  add column if not exists completion_issue_reported_at timestamptz;

alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_provider_transfer_status_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_provider_transfer_status_check
  check (provider_transfer_status in ('pending', 'processing', 'paid', 'failed', 'blocked'));

create unique index if not exists marketplace_bookings_stripe_transfer_uidx
  on public.marketplace_bookings(stripe_transfer_id) where stripe_transfer_id is not null;

create or replace function public.confirm_marketplace_completion(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  select b.* into current_booking
  from public.marketplace_bookings b
  join public.marketplace_customers c on c.id = b.customer_id
  where b.id = target_booking and c.auth_user_id = auth.uid()
  for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if current_booking.status <> 'awaiting_customer_completion' or current_booking.completion_status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  update public.marketplace_bookings set status = 'completed', completion_status = 'completed', customer_completed_at = coalesce(customer_completed_at, now()), updated_at = now() where id = target_booking returning * into current_booking;
  update public.marketplace_jobs set status = 'completed', updated_at = now() where id = current_booking.job_id;
  return current_booking;
end; $$;

create or replace function public.report_marketplace_completion_issue(target_booking uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare current_booking public.marketplace_bookings;
begin
  select b.* into current_booking
  from public.marketplace_bookings b
  join public.marketplace_customers c on c.id = b.customer_id
  where b.id = target_booking and c.auth_user_id = auth.uid()
  for update;
  if current_booking.id is null then raise exception 'booking_not_allowed'; end if;
  if current_booking.payment_status <> 'paid' then raise exception 'booking_not_paid'; end if;
  if current_booking.status <> 'awaiting_customer_completion' then raise exception 'completion_not_ready'; end if;
  update public.marketplace_bookings set completion_status = 'issue_reported', completion_issue_reported_at = coalesce(completion_issue_reported_at, now()), provider_transfer_status = 'blocked', provider_transfer_error = 'customer_issue_reported', updated_at = now() where id = target_booking returning * into current_booking;
  return current_booking;
end; $$;
