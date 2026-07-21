-- Controlled-pilot business enquiry intake.

create table if not exists public.business_enquiries (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  organisation_name text not null check (char_length(organisation_name) between 2 and 160),
  role_title text not null check (char_length(role_title) between 2 and 120),
  email text not null,
  phone text not null,
  customer_type text not null check (customer_type in ('letting_agent','property_manager','airbnb_operator','serviced_accommodation','portfolio_landlord','office_business','block_manager','commercial_operator','other')),
  site_count integer not null check (site_count between 1 and 10000),
  operating_area text not null,
  cleaning_type text not null check (cleaning_type in ('recurring_property','airbnb_turnover','end_of_tenancy','office','communal_area','deep_clean','property_turnaround','mixed')),
  expected_frequency text not null check (expected_frequency in ('one_off_managed','weekly','fortnightly','monthly','multiple_weekly','to_discuss')),
  start_timeframe text not null check (start_timeframe in ('within_2_weeks','within_1_month','within_3_months','planning')),
  notes text,
  status text not null default 'new' check (status in ('new','reviewing','qualified','invited','closed')),
  notification_status text not null default 'not_sent' check (notification_status in ('not_sent','sent','failed')),
  notification_error text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_enquiries_status_created_idx
  on public.business_enquiries(status, created_at desc);

alter table public.business_enquiries enable row level security;
drop policy if exists "admins manage business enquiries" on public.business_enquiries;
create policy "admins manage business enquiries" on public.business_enquiries
  for all to authenticated using (public.is_quickola_admin()) with check (public.is_quickola_admin());
