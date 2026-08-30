-- Decouple current marketplace provider identity from the legacy cleaner profile.
-- Provider IDs remain auth.users IDs so existing marketplace records do not need
-- an ID remap. Legacy STR tables are intentionally not dropped here.

create table if not exists public.marketplace_providers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Provider',
  business_name text,
  phone text,
  service_area text,
  marketplace_bio text,
  profile_photo_url text,
  provider_type text,
  base_town text,
  postcode text,
  postcode_area text,
  postcode_district text,
  years_experience integer,
  provider_status text not null default 'draft' check (provider_status in ('draft', 'pending_review', 'approved', 'action_required', 'suspended')),
  stripe_status text not null default 'not_started' check (stripe_status in ('not_started', 'onboarding', 'restricted', 'verification_pending', 'ready')),
  stripe_account_id text,
  submitted_at timestamptz,
  approved_at timestamptz,
  action_required_reason text,
  suspended_at timestamptz,
  availability_days text[] not null default '{}',
  available_now boolean not null default true,
  marketplace_active boolean not null default false,
  provider_terms_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.marketplace_providers (
  user_id, display_name, business_name, phone, service_area, marketplace_bio,
  profile_photo_url, provider_type, base_town, postcode, postcode_area,
  postcode_district, years_experience, provider_status, stripe_status,
  stripe_account_id, submitted_at, approved_at, action_required_reason,
  suspended_at, availability_days, available_now, marketplace_active,
  provider_terms_accepted_at, terms_version, created_at, updated_at
)
-- Exclude self-serve cleaner identities. Existing provider identities have no
-- separate legacy table, so their auth-linked profile is copied by default.
select
  user_id, coalesce(nullif(trim(display_name), ''), 'Provider'), business_name,
  phone, service_area, marketplace_bio, profile_photo_url, provider_type,
  base_town, postcode, postcode_area, postcode_district, years_experience,
  coalesce(nullif(provider_status, ''), 'draft'),
  coalesce(nullif(stripe_status, ''), 'not_started'), stripe_account_id,
  submitted_at, approved_at, action_required_reason, suspended_at,
  coalesce(availability_days, '{}'), coalesce(available_now, true),
  coalesce(marketplace_active, false), provider_terms_accepted_at, terms_version,
  created_at, updated_at
from public.cleaner_profiles profile
join auth.users auth_user on auth_user.id = profile.user_id
where coalesce(auth_user.raw_user_meta_data->>'account_kind', '') <> 'quickola_cleaner'
on conflict (user_id) do update set
  display_name = excluded.display_name,
  business_name = excluded.business_name,
  phone = excluded.phone,
  service_area = excluded.service_area,
  marketplace_bio = excluded.marketplace_bio,
  profile_photo_url = excluded.profile_photo_url,
  provider_type = excluded.provider_type,
  base_town = excluded.base_town,
  postcode = excluded.postcode,
  postcode_area = excluded.postcode_area,
  postcode_district = excluded.postcode_district,
  years_experience = excluded.years_experience,
  provider_status = excluded.provider_status,
  stripe_status = excluded.stripe_status,
  stripe_account_id = excluded.stripe_account_id,
  submitted_at = excluded.submitted_at,
  approved_at = excluded.approved_at,
  action_required_reason = excluded.action_required_reason,
  suspended_at = excluded.suspended_at,
  availability_days = excluded.availability_days,
  available_now = excluded.available_now,
  marketplace_active = excluded.marketplace_active,
  provider_terms_accepted_at = excluded.provider_terms_accepted_at,
  terms_version = excluded.terms_version,
  updated_at = excluded.updated_at;

create index if not exists marketplace_providers_status_idx
  on public.marketplace_providers(provider_status, stripe_status);
create unique index if not exists marketplace_providers_stripe_account_idx
  on public.marketplace_providers(stripe_account_id)
  where stripe_account_id is not null;
create index if not exists marketplace_providers_postcode_district_idx
  on public.marketplace_providers(postcode_district);

alter table public.marketplace_providers enable row level security;
drop policy if exists "providers view own marketplace profile" on public.marketplace_providers;
create policy "providers view own marketplace profile"
  on public.marketplace_providers for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "providers update own marketplace profile" on public.marketplace_providers;
create policy "providers update own marketplace profile"
  on public.marketplace_providers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admins manage marketplace providers" on public.marketplace_providers;
create policy "admins manage marketplace providers"
  on public.marketplace_providers for all to authenticated
  using (public.is_quickola_admin()) with check (public.is_quickola_admin());

create or replace function public.prevent_marketplace_provider_protected_field_write()
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
      or new.marketplace_active is distinct from old.marketplace_active
    then
      raise exception 'provider_status_fields_are_server_managed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_providers_protected_fields on public.marketplace_providers;
create trigger marketplace_providers_protected_fields
before update on public.marketplace_providers
for each row execute function public.prevent_marketplace_provider_protected_field_write();

do $$
declare
  fk record;
  rewritten text;
begin
  for fk in
    select c.oid, c.conname, c.conrelid::regclass as child_table,
           pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    where c.contype = 'f'
      and c.confrelid = 'public.cleaner_profiles'::regclass
      and c.conrelid::regclass::text like 'public.marketplace_%'
  loop
    rewritten := regexp_replace(
      fk.definition,
      E'REFERENCES public\\.cleaner_profiles\\s*\\(\\s*user_id\\s*\\)',
      'REFERENCES public.marketplace_providers(user_id)',
      1, 1, 'i'
    );
    execute format('alter table %s drop constraint %I', fk.child_table, fk.conname);
    execute format('alter table %s add constraint %I %s', fk.child_table, fk.conname, rewritten);
  end loop;
end
$$;

create or replace function public.marketplace_provider_can_operate(provider_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.marketplace_providers
    where user_id = provider_user
      and provider_status = 'approved'
      and stripe_status = 'ready'
      and marketplace_active = true
      and exists (select 1 from auth.users u where u.id = provider_user and u.email_confirmed_at is not null)
  );
$$;

create or replace function public.get_or_create_marketplace_conversation(
  target_job uuid,
  target_provider uuid default null
)
returns public.marketplace_conversations
language plpgsql security definer set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  job_row public.marketplace_jobs;
  customer_row public.marketplace_customers;
  provider_user uuid := coalesce(target_provider, current_user_id);
  result public.marketplace_conversations;
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  select * into job_row from public.marketplace_jobs where id = target_job;
  if job_row.id is null then raise exception 'job_not_found'; end if;
  select * into customer_row from public.marketplace_customers where id = job_row.customer_id;
  if customer_row.id is null then raise exception 'customer_not_found'; end if;

  if customer_row.auth_user_id = current_user_id then
    if target_provider is null then raise exception 'provider_required'; end if;
    if not exists (select 1 from public.marketplace_quotes q where q.job_id = target_job and coalesce(q.provider_id, q.bidder_user_id) = provider_user) then
      raise exception 'provider_not_connected';
    end if;
  elsif provider_user <> current_user_id or not public.marketplace_provider_can_operate(current_user_id) then
    raise exception 'conversation_not_allowed';
  end if;
  if customer_row.auth_user_id <> current_user_id and not exists (
    select 1 from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = current_user_id and ps.active and pa.active
      and ps.category_slug = job_row.service and ps.job_type_slug = job_row.service_subtype
      and (job_row.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
      and upper(pa.postcode_district) = upper(split_part(trim(job_row.postcode), ' ', 1))
  ) and not exists (
    select 1 from public.marketplace_quotes q
    where q.job_id = target_job and coalesce(q.provider_id, q.bidder_user_id) = current_user_id
  ) then raise exception 'provider_not_eligible'; end if;

  select * into result from public.marketplace_conversations c
  where c.job_id = target_job and coalesce(c.provider_id, c.bidder_user_id) = provider_user limit 1;
  if result.id is not null then return result; end if;

  insert into public.marketplace_conversations(job_id, customer_id, provider_id, bidder_user_id)
  values (target_job, job_row.customer_id, provider_user, provider_user)
  on conflict do nothing returning * into result;
  if result.id is null then
    select * into result from public.marketplace_conversations c
    where c.job_id = target_job and coalesce(c.provider_id, c.bidder_user_id) = provider_user limit 1;
  end if;
  return result;
end;
$$;

revoke all on function public.marketplace_provider_can_operate(uuid) from public, anon;
grant execute on function public.marketplace_provider_can_operate(uuid) to authenticated;
revoke all on function public.get_or_create_marketplace_conversation(uuid, uuid) from public, anon;
grant execute on function public.get_or_create_marketplace_conversation(uuid, uuid) to authenticated;
