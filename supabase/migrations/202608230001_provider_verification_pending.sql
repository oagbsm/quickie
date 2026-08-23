alter table public.cleaner_profiles
  drop constraint if exists cleaner_profiles_stripe_status_check;

alter table public.cleaner_profiles
  add constraint cleaner_profiles_stripe_status_check
  check (stripe_status in ('not_started', 'onboarding', 'restricted', 'verification_pending', 'ready'));
