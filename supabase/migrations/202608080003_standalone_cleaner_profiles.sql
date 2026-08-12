-- Direct Quickola cleaners have a private identity without a host-owned account.
-- Invited cleaners continue to use public.workers and its existing acceptance flow.

create table if not exists public.cleaner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'cleaner' check (role = 'cleaner'),
  display_name text not null default 'Cleaner' check (char_length(trim(display_name)) between 1 and 120),
  business_name text,
  service_area text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cleaner_profiles enable row level security;

create policy "cleaners view own direct profile" on public.cleaner_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "cleaners update own direct profile" on public.cleaner_profiles
  for update to authenticated
  using (user_id = auth.uid() and role = 'cleaner')
  with check (user_id = auth.uid() and role = 'cleaner');

create or replace function public.initialize_direct_cleaner_profile()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  metadata jsonb;
  created_profile uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select raw_user_meta_data into metadata
  from auth.users
  where id = current_user_id;

  if coalesce(metadata->>'account_kind', '') <> 'quickola_cleaner' then
    raise exception 'direct_cleaner_account_required' using errcode = '42501';
  end if;

  -- A business identity or an invited worker must never be converted into a
  -- second cleaner identity by this public client-callable function.
  if exists (select 1 from public.business_members where user_id = current_user_id) then
    raise exception 'business_user_cannot_become_direct_cleaner' using errcode = '42501';
  end if;
  if exists (select 1 from public.workers where user_id = current_user_id) then
    return null;
  end if;

  insert into public.cleaner_profiles(user_id, role, display_name)
  values (
    current_user_id,
    'cleaner',
    coalesce(nullif(trim(metadata->>'full_name'), ''), 'Cleaner')
  )
  on conflict (user_id) do nothing
  returning user_id into created_profile;

  if created_profile is null then
    select user_id into created_profile
    from public.cleaner_profiles
    where user_id = current_user_id;
  end if;
  return created_profile;
end;
$$;

revoke all on function public.initialize_direct_cleaner_profile() from public, anon;
grant execute on function public.initialize_direct_cleaner_profile() to authenticated;
grant select, update on public.cleaner_profiles to authenticated;

-- Keep the existing one-portal rule intact for the new standalone identity.
create or replace function public.reject_cross_portal_role_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id then return new; end if;
  if new.user_id is null then return new; end if;
  if tg_table_name = 'workers'
     and current_setting('quickola.accepting_cleaner_invitation', true) = 'true'
  then return new; end if;
  if tg_table_name = 'business_members' and (
    exists (select 1 from public.workers worker where worker.user_id = new.user_id)
    or exists (select 1 from public.cleaner_profiles profile where profile.user_id = new.user_id)
  ) then
    raise exception 'cleaner_user_cannot_become_business_member' using errcode = '23514';
  end if;
  if tg_table_name = 'workers' and (
    exists (select 1 from public.business_members member where member.user_id = new.user_id)
    or exists (select 1 from public.cleaner_profiles profile where profile.user_id = new.user_id)
  ) then
    raise exception 'business_user_cannot_become_cleaner' using errcode = '23514';
  end if;
  return new;
end; $$;
