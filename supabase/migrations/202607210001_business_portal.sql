-- Quickola customer property-management portal.
-- The existing public.businesses table represents cleaning providers and is intentionally untouched.

create extension if not exists pgcrypto;

create table if not exists public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  customer_type text not null check (customer_type in ('landlord','airbnb_operator','letting_agent','property_manager','office_business','block_manager','other')),
  phone text,
  status text not null default 'active' check (status in ('pending','active','suspended')),
  payment_mode text check (payment_mode in ('saved_card','pay_per_job','invoice_account')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'owner' check (role in ('owner','manager','viewer')),
  created_at timestamptz not null default now(),
  primary key (account_id, user_id), unique (user_id)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id),
  nickname text not null, address_line_1 text not null, address_line_2 text, city text not null, postcode text not null,
  property_type text not null check (property_type in ('house','flat','airbnb','office','shop','communal_area','other')),
  bedrooms smallint check (bedrooms between 0 and 100), bathrooms numeric(4,1) check (bathrooms between 0 and 100),
  approximate_size integer check (approximate_size > 0), access_method text not null, access_notes text, parking_notes text,
  default_service text, default_checklist jsonb not null default '[]', preferred_frequency text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.business_bookings (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id),
  property_id uuid not null references public.properties(id), service text not null check (service in ('regular_cleaning','deep_cleaning','airbnb_turnover','end_of_tenancy','after_builders')),
  scheduled_start timestamptz not null, ready_by timestamptz, duration_minutes integer, requirements text,
  recurrence text not null default 'one_off', status text not null default 'submitted' check (status in ('draft','submitted','awaiting_review','quoted','confirmed','assigned','cover_required','in_progress','completed','issue_reported','cancelled')),
  price_pence integer check (price_pence >= 0), payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','not_applicable')),
  checkout_at timestamptz, next_checkin_at timestamptz, linen_required boolean, laundry_required boolean, restocking_required boolean, damage_check_required boolean,
  check_in_at timestamptz, check_out_at timestamptz, completion_notes text, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.recurring_schedules (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), property_id uuid not null references public.properties(id),
  service text not null, frequency text not null check (frequency in ('weekly','fortnightly','monthly','selected_weekdays')),
  preferred_days smallint[], preferred_time time, start_date date not null, end_date date, requirements text,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.business_issues (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), booking_id uuid not null references public.business_bookings(id), property_id uuid not null references public.properties(id),
  issue_type text not null, description text not null, priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'reported' check (status in ('reported','being_reviewed','resolution_arranged','resolved')),
  resolution_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.booking_photos (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), booking_id uuid not null references public.business_bookings(id),
  storage_path text not null, photo_type text not null default 'completion', caption text, created_at timestamptz not null default now()
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), booking_id uuid references public.business_bookings(id),
  invoice_number text unique, amount_pence integer not null check (amount_pence >= 0), status text not null default 'pending', issued_at timestamptz, paid_at timestamptz, file_path text, created_at timestamptz not null default now()
);
create table if not exists public.business_notifications (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), booking_id uuid references public.business_bookings(id),
  notification_type text not null, recipient text not null, channel text not null, delivery_status text not null default 'pending', provider_message_id text, sent_at timestamptz, error text,
  created_at timestamptz not null default now(), unique (booking_id, notification_type, recipient, channel)
);
create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.business_accounts(id), user_id uuid not null references auth.users(id),
  terms_version text not null, accepted_at timestamptz not null default now(), unique(account_id, user_id, terms_version)
);

create index if not exists properties_account_idx on public.properties(account_id, status);
create index if not exists bookings_account_date_idx on public.business_bookings(account_id, scheduled_start);
create index if not exists bookings_property_idx on public.business_bookings(property_id, scheduled_start);
create index if not exists schedules_account_idx on public.recurring_schedules(account_id, status);
create index if not exists issues_account_idx on public.business_issues(account_id, status);

create or replace function public.is_business_member(target_account uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.business_members m where m.account_id = target_account and m.user_id = auth.uid());
$$;
revoke all on function public.is_business_member(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;

alter table public.business_accounts enable row level security;
alter table public.business_members enable row level security;
alter table public.properties enable row level security;
alter table public.business_bookings enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.business_issues enable row level security;
alter table public.booking_photos enable row level security;
alter table public.invoices enable row level security;
alter table public.business_notifications enable row level security;
alter table public.terms_acceptances enable row level security;

create policy "members view account" on public.business_accounts for select using (public.is_business_member(id));
create policy "members view memberships" on public.business_members for select using (user_id = auth.uid());
create policy "members manage properties" on public.properties for all using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage bookings" on public.business_bookings for all using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage schedules" on public.recurring_schedules for all using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage issues" on public.business_issues for all using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members view photos" on public.booking_photos for select using (public.is_business_member(account_id));
create policy "members view invoices" on public.invoices for select using (public.is_business_member(account_id));
create policy "members view notifications" on public.business_notifications for select using (public.is_business_member(account_id));
create policy "members accept terms" on public.terms_acceptances for insert with check (user_id = auth.uid() and public.is_business_member(account_id));
create policy "members view terms" on public.terms_acceptances for select using (user_id = auth.uid() and public.is_business_member(account_id));

create or replace function public.create_business_account_for_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare new_account uuid;
begin
  if new.raw_user_meta_data->>'account_kind' = 'quickola_business' then
    insert into public.business_accounts(name, customer_type, phone)
    values (coalesce(nullif(new.raw_user_meta_data->>'business_name',''), 'My properties'), coalesce(nullif(new.raw_user_meta_data->>'customer_type',''), 'other'), new.raw_user_meta_data->>'phone') returning id into new_account;
    insert into public.business_members(account_id, user_id, full_name, role)
    values (new_account, new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Account owner'), 'owner');
  end if;
  return new;
end; $$;
drop trigger if exists on_business_user_created on auth.users;
create trigger on_business_user_created after insert on auth.users for each row execute function public.create_business_account_for_user();

-- Create a private bucket in the Supabase dashboard named business-evidence.
-- Storage policies are added after the bucket exists; object paths must start with the account UUID.
