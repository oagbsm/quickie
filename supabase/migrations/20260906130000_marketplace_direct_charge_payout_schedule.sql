-- Direct-charge payouts are scheduled after customer completion and released
-- only when the per-booking eligibility time and Stripe balance checks pass.
alter table public.marketplace_payout_allocations
  add column if not exists payout_eligible_at timestamptz,
  add column if not exists payout_initiated_at timestamptz;

alter table public.marketplace_payout_allocations
  drop constraint if exists marketplace_payout_allocations_payout_status_check;
alter table public.marketplace_payout_allocations
  add constraint marketplace_payout_allocations_payout_status_check
  check (payout_status in ('pending', 'scheduled', 'held', 'processing', 'paid', 'failed'));

create index if not exists marketplace_direct_payouts_due_idx
  on public.marketplace_payout_allocations(payout_eligible_at)
  where payout_status in ('scheduled', 'held', 'failed') and stripe_payout_id is null;
