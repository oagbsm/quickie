-- Lightweight supply signal only. This does not create marketplace jobs or
-- change cleaner onboarding, verification, payout, or RLS behaviour.
alter table public.cleaner_profiles
  add column if not exists interested_in_marketplace_work boolean not null default false;

