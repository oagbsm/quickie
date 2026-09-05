-- Keep transfer-operation attempts durable so definitive Stripe failures can
-- be retried with a new idempotency key without rotating ambiguous requests.
alter table public.marketplace_bookings
  add column if not exists provider_transfer_attempt integer not null default 0;

alter table public.marketplace_bookings
  drop constraint if exists marketplace_bookings_provider_transfer_attempt_check;

alter table public.marketplace_bookings
  add constraint marketplace_bookings_provider_transfer_attempt_check
  check (provider_transfer_attempt >= 0);
