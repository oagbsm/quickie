alter table public.marketplace_customers
  alter column mobile drop not null,
  add column if not exists display_name text;

create table if not exists public.marketplace_job_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_token uuid not null unique default gen_random_uuid(),
  payload jsonb not null,
  photo_paths jsonb not null default '[]'::jsonb,
  published_job_id uuid unique references public.marketplace_jobs(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketplace_job_drafts enable row level security;
create index if not exists marketplace_job_drafts_expiry_idx on public.marketplace_job_drafts(expires_at);

alter table public.marketplace_jobs
  add column if not exists published_draft_id uuid unique references public.marketplace_job_drafts(id) on delete set null;

create table if not exists public.marketplace_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.marketplace_customers(id) on delete set null,
  job_id uuid references public.marketplace_jobs(id) on delete cascade,
  event_type text not null,
  recipient text not null,
  idempotency_key text not null unique,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_category text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.marketplace_email_deliveries enable row level security;

drop policy if exists "providers view eligible marketplace jobs" on public.marketplace_jobs;

create policy "customers view own marketplace jobs" on public.marketplace_jobs for select to authenticated using (
  exists (select 1 from public.marketplace_customers c where c.id = marketplace_jobs.customer_id and c.auth_user_id = auth.uid())
);
create policy "customers view own marketplace quotes" on public.marketplace_quotes for select to authenticated using (
  exists (select 1 from public.marketplace_jobs j join public.marketplace_customers c on c.id = j.customer_id where j.id = marketplace_quotes.job_id and c.auth_user_id = auth.uid())
);
create policy "customers view own marketplace bookings" on public.marketplace_bookings for select to authenticated using (
  exists (select 1 from public.marketplace_customers c where c.id = marketplace_bookings.customer_id and c.auth_user_id = auth.uid())
);
create policy "customers view own marketplace customer" on public.marketplace_customers for select to authenticated using (auth_user_id = auth.uid());
create policy "customers update own marketplace customer" on public.marketplace_customers for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create or replace function public.get_marketplace_opportunities()
returns table (id uuid, category_slug text, job_type_slug text, structured_answers jsonb, postcode_district text, requested_timing text, optional_note text, photo_count bigint, status text)
language sql security definer set search_path = public
as $$
  select j.id, j.service, j.service_subtype, j.pricing_answers,
    split_part(trim(j.postcode), ' ', 1), j.requested_timing, j.optional_note,
    (select count(*) from public.marketplace_job_photos p where p.job_id = j.id), j.status
  from public.marketplace_jobs j
  where j.status in ('posted', 'finding_provider')
    and exists (select 1 from public.marketplace_provider_services ps
      join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
      where ps.provider_id = auth.uid() and ps.active and pa.active
        and ps.category_slug = j.service and ps.job_type_slug = j.service_subtype
        and (j.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
        and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1)));
$$;
revoke all on function public.get_marketplace_opportunities() from public;
grant execute on function public.get_marketplace_opportunities() to authenticated;
