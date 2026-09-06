-- Persist Stripe's authoritative balance-transaction data for provider-facing
-- direct-charge status. These fields are not payout dates and must not be used
-- as a substitute for a Stripe Payout object.
alter table public.marketplace_payout_allocations
  add column if not exists stripe_balance_transaction_id text,
  add column if not exists stripe_available_on timestamptz;

create index if not exists marketplace_payout_allocations_balance_transaction_idx
  on public.marketplace_payout_allocations(stripe_balance_transaction_id)
  where stripe_balance_transaction_id is not null;
