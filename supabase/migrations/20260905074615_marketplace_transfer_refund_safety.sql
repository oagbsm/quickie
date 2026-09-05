-- Keep transfer state auditable and make refund/transfer retries observable.
-- Refund-after-transfer reversal remains intentionally deferred.

create index if not exists marketplace_refunds_pending_booking_idx
  on public.marketplace_refunds(booking_id)
  where status = 'pending';

alter table public.marketplace_bookings
  drop constraint if exists marketplace_bookings_paid_transfer_fields_check;

alter table public.marketplace_bookings
  add constraint marketplace_bookings_paid_transfer_fields_check
  check (
    provider_transfer_status <> 'paid'
    or (
      stripe_transfer_id is not null
      and provider_transfer_amount_pence is not null
      and provider_transfer_amount_pence > 0
      and provider_transferred_at is not null
    )
  ) not valid;

comment on column public.marketplace_bookings.provider_transfer_error is
  'Stable internal failure code; do not expose raw Stripe error details to providers.';
