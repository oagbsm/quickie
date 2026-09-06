-- Mixed-mode payment state. Existing bookings remain platform-transfer bookings;
-- direct-charge fields are additive and are never inferred from Stripe objects.
alter table public.marketplace_bookings
  add column if not exists payment_flow text not null default 'platform_transfer',
  add column if not exists stripe_connected_account_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_application_fee_id text;

update public.marketplace_bookings
set payment_flow = 'platform_transfer'
where payment_flow is null;

alter table public.marketplace_bookings drop constraint if exists marketplace_bookings_payment_flow_check;
alter table public.marketplace_bookings add constraint marketplace_bookings_payment_flow_check
  check (payment_flow in ('platform_transfer', 'direct_charge'));

create unique index if not exists marketplace_bookings_stripe_charge_uidx
  on public.marketplace_bookings(stripe_charge_id) where stripe_charge_id is not null;
create unique index if not exists marketplace_bookings_stripe_application_fee_uidx
  on public.marketplace_bookings(stripe_application_fee_id) where stripe_application_fee_id is not null;

-- One allocation per direct-charge booking. The payout amount is never the
-- provider's aggregate Stripe balance; it is the amount attributable to this
-- completed booking after the recorded application/Stripe fees.
create table if not exists public.marketplace_payout_allocations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.marketplace_bookings(id) on delete restrict,
  provider_id uuid not null references public.marketplace_providers(user_id) on delete restrict,
  stripe_connected_account_id text not null,
  gross_amount_pence bigint not null check (gross_amount_pence > 0),
  quickola_fee_pence bigint not null check (quickola_fee_pence >= 0),
  stripe_fee_pence bigint not null check (stripe_fee_pence >= 0),
  provider_net_pence bigint not null check (provider_net_pence > 0),
  payout_status text not null default 'pending' check (payout_status in ('pending', 'processing', 'paid', 'failed')),
  stripe_payout_id text unique,
  paid_out_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketplace_payout_allocations enable row level security;
revoke all on public.marketplace_payout_allocations from anon, authenticated;
