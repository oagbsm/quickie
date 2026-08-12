create table if not exists public.marketplace_jobs (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  service text not null,
  service_subtype text,
  pricing_answers jsonb not null default '{}'::jsonb,
  postcode text not null,
  requested_timing text,
  optional_note text,
  estimated_price_pence integer,
  estimated_price_max_pence integer,
  booking_fee_pence integer,
  pricing_confidence text not null default 'not_configured' check (pricing_confidence in ('high', 'range', 'not_configured')),
  contact_method text not null check (contact_method in ('email', 'phone')),
  contact_value text not null,
  contact_name text,
  status text not null default 'posted' check (status in ('posted', 'finding_provider', 'provider_available', 'awaiting_booking', 'booked', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists marketplace_jobs_status_created_idx on public.marketplace_jobs (status, created_at desc);
alter table public.marketplace_jobs enable row level security;
comment on table public.marketplace_jobs is 'Consumer marketplace job requests. Provider matching and payment are separate capabilities.';
