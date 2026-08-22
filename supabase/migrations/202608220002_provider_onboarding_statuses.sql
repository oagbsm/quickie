alter table public.cleaner_profiles
  add column if not exists provider_status text not null default 'draft',
  add column if not exists stripe_status text not null default 'not_started',
  add column if not exists stripe_account_id text,
  add column if not exists provider_type text,
  add column if not exists base_town text,
  add column if not exists postcode text,
  add column if not exists postcode_area text,
  add column if not exists postcode_district text,
  add column if not exists years_experience integer,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists action_required_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists availability_days text[] not null default '{}',
  add column if not exists available_now boolean not null default true,
  add column if not exists provider_terms_accepted_at timestamptz,
  add column if not exists terms_version text;

alter table public.cleaner_profiles
  drop constraint if exists cleaner_profiles_provider_status_check,
  drop constraint if exists cleaner_profiles_stripe_status_check;

alter table public.cleaner_profiles
  add constraint cleaner_profiles_provider_status_check check (provider_status in ('draft', 'pending_review', 'approved', 'action_required', 'suspended')),
  add constraint cleaner_profiles_stripe_status_check check (stripe_status in ('not_started', 'onboarding', 'restricted', 'ready'));

update public.cleaner_profiles
set provider_status = case when marketplace_active then 'approved' else 'draft' end
where provider_status is null or provider_status = '' or (marketplace_active and provider_status = 'draft');

create index if not exists cleaner_profiles_provider_status_idx on public.cleaner_profiles(provider_status, stripe_status);
create index if not exists cleaner_profiles_stripe_account_idx on public.cleaner_profiles(stripe_account_id) where stripe_account_id is not null;
create index if not exists cleaner_profiles_postcode_district_idx on public.cleaner_profiles(postcode_district);

create table if not exists public.marketplace_provider_status_history (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_provider_status_history_provider_idx
  on public.marketplace_provider_status_history(provider_id, created_at desc);

alter table public.marketplace_provider_status_history enable row level security;
drop policy if exists "providers view own status history" on public.marketplace_provider_status_history;
create policy "providers view own status history"
  on public.marketplace_provider_status_history for select to authenticated
  using (provider_id = auth.uid());
drop policy if exists "admins manage provider status history" on public.marketplace_provider_status_history;
create policy "admins manage provider status history"
  on public.marketplace_provider_status_history for all to authenticated
  using (public.is_quickola_admin()) with check (public.is_quickola_admin());

create or replace function public.prevent_provider_protected_field_write()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() = old.user_id and current_user <> 'service_role' then
    if new.provider_status is distinct from old.provider_status
      or new.stripe_status is distinct from old.stripe_status
      or new.stripe_account_id is distinct from old.stripe_account_id
      or new.submitted_at is distinct from old.submitted_at
      or new.approved_at is distinct from old.approved_at
      or new.action_required_reason is distinct from old.action_required_reason
      or new.suspended_at is distinct from old.suspended_at
    then
      raise exception 'provider_status_fields_are_server_managed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cleaner_profiles_protected_fields on public.cleaner_profiles;
create trigger cleaner_profiles_protected_fields
before update on public.cleaner_profiles
for each row execute function public.prevent_provider_protected_field_write();
