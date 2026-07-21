-- Corrective migration: recover users stranded when the original auth trigger did not
-- create a workspace, and add honest Slough service-area state.

alter table public.business_accounts
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists business_accounts_owner_user_idx
  on public.business_accounts(owner_user_id) where owner_user_id is not null;

update public.business_accounts a
set owner_user_id = m.user_id
from public.business_members m
where m.account_id = a.id and m.role = 'owner' and a.owner_user_id is null;

alter table public.properties add column if not exists cleaning_notes text;
alter table public.properties add column if not exists key_instructions text;
alter table public.properties add column if not exists linen_requirements text;
alter table public.properties add column if not exists is_airbnb_turnover boolean not null default false;
alter table public.properties add column if not exists service_area_status text not null default 'outside_area'
  check (service_area_status in ('eligible','outside_area','waitlisted'));

update public.properties
set service_area_status = case
  when upper(replace(postcode, ' ', '')) like 'SL1%'
    or upper(replace(postcode, ' ', '')) like 'SL2%'
    or upper(replace(postcode, ' ', '')) like 'SL3%'
  then 'eligible' else 'outside_area' end;

create table if not exists public.service_area_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  postcode text not null,
  status text not null default 'requested' check (status in ('requested','contacted','covered','closed')),
  created_at timestamptz not null default now(),
  unique(property_id)
);
alter table public.service_area_requests enable row level security;
create policy "members manage coverage requests" on public.service_area_requests for all
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));

create or replace function public.ensure_business_workspace()
returns table(account_id uuid, role text, provisioned boolean)
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  resolved_account uuid;
  resolved_role text;
  created_now boolean := false;
  metadata jsonb;
  account_name text;
  account_type text;
begin
  if current_user_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;

  -- Serialize provisioning for this auth user so concurrent requests cannot duplicate workspaces.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select m.account_id, m.role into resolved_account, resolved_role
  from public.business_members m where m.user_id = current_user_id limit 1;

  if resolved_account is null then
    select a.id into resolved_account from public.business_accounts a
    where a.owner_user_id = current_user_id limit 1;

    if resolved_account is null then
      select u.raw_user_meta_data into metadata from auth.users u where u.id = current_user_id;
      account_name := coalesce(nullif(trim(metadata->>'business_name'), ''), 'My properties');
      account_type := coalesce(nullif(metadata->>'customer_type', ''), 'other');
      if account_type not in ('landlord','airbnb_operator','letting_agent','property_manager','office_business','block_manager','other') then account_type := 'other'; end if;
      insert into public.business_accounts(name, customer_type, phone, owner_user_id)
      values(account_name, account_type, metadata->>'phone', current_user_id)
      on conflict (owner_user_id) where owner_user_id is not null do update set updated_at = public.business_accounts.updated_at
      returning id into resolved_account;
      created_now := true;
    end if;

    select u.raw_user_meta_data into metadata from auth.users u where u.id = current_user_id;
    insert into public.business_members(account_id, user_id, full_name, role)
    values(resolved_account, current_user_id, coalesce(nullif(trim(metadata->>'full_name'), ''), 'Account owner'), 'owner')
    on conflict (user_id) do nothing;
  end if;

  select m.account_id, m.role into resolved_account, resolved_role
  from public.business_members m where m.user_id = current_user_id limit 1;
  if resolved_account is null then raise exception 'workspace_membership_unresolved'; end if;
  return query select resolved_account, resolved_role, created_now;
end; $$;
revoke all on function public.ensure_business_workspace() from public;
grant execute on function public.ensure_business_workspace() to authenticated;

create or replace function public.create_business_account_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare new_account uuid; account_type text;
begin
  if new.raw_user_meta_data->>'account_kind' = 'quickola_business' then
    account_type := coalesce(nullif(new.raw_user_meta_data->>'customer_type',''), 'other');
    if account_type not in ('landlord','airbnb_operator','letting_agent','property_manager','office_business','block_manager','other') then account_type := 'other'; end if;
    insert into public.business_accounts(name, customer_type, phone, owner_user_id)
    values(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'),''), 'My properties'), account_type, new.raw_user_meta_data->>'phone', new.id)
    on conflict (owner_user_id) where owner_user_id is not null do update set updated_at = public.business_accounts.updated_at
    returning id into new_account;
    insert into public.business_members(account_id, user_id, full_name, role)
    values(new_account, new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), 'Account owner'), 'owner')
    on conflict (user_id) do nothing;
  end if;
  return new;
end; $$;

-- Customers may request/cancel but may not modify operational status, price or completion fields.
drop policy if exists "members manage bookings" on public.business_bookings;
create policy "members view bookings" on public.business_bookings for select using (public.is_business_member(account_id));
create policy "members request bookings" on public.business_bookings for insert with check (
  public.is_business_member(account_id) and status in ('submitted','awaiting_review') and price_pence is null
  and check_in_at is null and check_out_at is null and completed_at is null
);

alter table public.business_bookings add column if not exists assigned_provider_id uuid;
alter table public.business_bookings add column if not exists provider_access_token text unique;
alter table public.business_bookings add column if not exists internal_notes text;
alter table public.business_bookings add column if not exists completion_checklist jsonb;

create table if not exists public.completion_reports (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id) on delete cascade,
  booking_id uuid not null unique references public.business_bookings(id) on delete cascade,
  provider_id uuid,
  checklist jsonb not null, notes text, issues_found text, completed_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.completion_reports enable row level security;
create policy "members view completion reports" on public.completion_reports for select using (public.is_business_member(account_id));

-- The provider table belongs to Quickola's pre-existing operational schema and
-- may not exist in a brand-new project. Add provider foreign keys only when it
-- is present, while still allowing the customer portal migration to complete.
do $$
begin
  if to_regclass('public.businesses') is not null then
    if not exists (select 1 from pg_constraint where conname = 'business_bookings_assigned_provider_id_fkey') then
      alter table public.business_bookings add constraint business_bookings_assigned_provider_id_fkey
        foreign key (assigned_provider_id) references public.businesses(id) on delete set null;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'completion_reports_provider_id_fkey') then
      alter table public.completion_reports add constraint completion_reports_provider_id_fkey
        foreign key (provider_id) references public.businesses(id) on delete set null;
    end if;
  end if;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('business-evidence','business-evidence',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "members view own business evidence" on storage.objects for select to authenticated
using(bucket_id='business-evidence' and public.is_business_member(((storage.foldername(name))[1])::uuid));
