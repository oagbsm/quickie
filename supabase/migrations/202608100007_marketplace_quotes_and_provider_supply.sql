create table if not exists public.marketplace_customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  mobile text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cleaner_profiles
  add column if not exists marketplace_bio text,
  add column if not exists profile_photo_url text,
  add column if not exists provider_terms_accepted_at timestamptz,
  add column if not exists marketplace_active boolean not null default false,
  add column if not exists subscription_status text not null default 'trial',
  add column if not exists trial_ends_at timestamptz;

alter table public.marketplace_jobs
  add column if not exists customer_id uuid references public.marketplace_customers(id) on delete set null,
  add column if not exists approximate_area text,
  add column if not exists requested_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.marketplace_provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  category_slug text not null,
  job_type_slug text not null,
  active boolean not null default true,
  qualification_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique(provider_id, job_type_slug)
);

create table if not exists public.marketplace_provider_service_areas (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  postcode_district text not null,
  active boolean not null default true,
  unique(provider_id, postcode_district)
);

create table if not exists public.marketplace_job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.marketplace_jobs(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.marketplace_jobs(id) on delete cascade,
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  amount_pence integer not null check (amount_pence > 0),
  availability_type text not null default 'flexible' check (availability_type in ('today', 'tomorrow', 'date', 'flexible')),
  available_at timestamptz,
  availability_text text,
  message text,
  status text not null default 'submitted' check (status in ('submitted', 'selected', 'declined', 'withdrawn', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, provider_id)
);

create table if not exists public.marketplace_bookings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.marketplace_jobs(id) on delete cascade,
  quote_id uuid not null references public.marketplace_quotes(id),
  customer_id uuid references public.marketplace_customers(id) on delete set null,
  provider_id uuid not null references public.cleaner_profiles(user_id),
  quoted_service_price_pence integer not null check (quoted_service_price_pence > 0),
  booking_fee_pence integer,
  booking_fee_status text not null default 'unpaid' check (booking_fee_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  status text not null default 'awaiting_booking_fee' check (status in ('awaiting_booking_fee', 'booked', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')),
  exact_address_line_1 text,
  exact_address_line_2 text,
  exact_town text,
  exact_postcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_jobs_status_idx on public.marketplace_jobs(status, created_at desc);
create index if not exists marketplace_quotes_job_idx on public.marketplace_quotes(job_id, status);
create index if not exists marketplace_quotes_provider_idx on public.marketplace_quotes(provider_id, status);
create index if not exists marketplace_provider_services_job_idx on public.marketplace_provider_services(job_type_slug, active);
create index if not exists marketplace_provider_areas_district_idx on public.marketplace_provider_service_areas(postcode_district, active);
create index if not exists marketplace_bookings_provider_idx on public.marketplace_bookings(provider_id, status);

alter table public.marketplace_customers enable row level security;
alter table public.marketplace_provider_services enable row level security;
alter table public.marketplace_provider_service_areas enable row level security;
alter table public.marketplace_job_photos enable row level security;
alter table public.marketplace_quotes enable row level security;
alter table public.marketplace_bookings enable row level security;

create policy "providers manage own marketplace services" on public.marketplace_provider_services for all to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid() and qualification_verified = false);
create policy "providers manage own marketplace areas" on public.marketplace_provider_service_areas for all to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy "providers view eligible marketplace jobs" on public.marketplace_jobs for select to authenticated using (
  status in ('posted', 'finding_provider') and exists (
    select 1 from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = auth.uid() and ps.active and pa.active
      and ps.category_slug = marketplace_jobs.service
      and ps.job_type_slug = marketplace_jobs.service_subtype
      and (marketplace_jobs.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
      and upper(pa.postcode_district) = upper(split_part(trim(marketplace_jobs.postcode), ' ', 1))
  )
);
create policy "providers view own marketplace quotes" on public.marketplace_quotes for select to authenticated using (provider_id = auth.uid());
create policy "providers create own marketplace quotes" on public.marketplace_quotes for insert to authenticated with check (provider_id = auth.uid());
create policy "providers update own marketplace quotes" on public.marketplace_quotes for update to authenticated using (provider_id = auth.uid() and status = 'submitted') with check (provider_id = auth.uid());
create policy "providers view photos for eligible jobs" on public.marketplace_job_photos for select to authenticated using (exists (select 1 from public.marketplace_jobs j join public.marketplace_provider_services ps on ps.category_slug = j.service and ps.job_type_slug = j.service_subtype join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id where j.id = marketplace_job_photos.job_id and ps.provider_id = auth.uid() and ps.active and pa.active and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))));
create policy "providers view selected bookings" on public.marketplace_bookings for select to authenticated using (provider_id = auth.uid());

create or replace function public.submit_marketplace_quote(target_job uuid, quote_amount integer, quote_availability text, quote_available_at timestamptz default null, quote_availability_text text default null, quote_message text default null)
returns public.marketplace_quotes language plpgsql security definer set search_path = public
as $$
declare j public.marketplace_jobs; result public.marketplace_quotes;
begin
  select * into j from public.marketplace_jobs where id = target_job for update;
  if j.id is null or j.status not in ('posted', 'finding_provider') then raise exception 'job_not_open'; end if;
  if not exists (select 1 from public.marketplace_provider_services ps join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id where ps.provider_id = auth.uid() and ps.active and pa.active and ps.category_slug = j.service and ps.job_type_slug = j.service_subtype and (j.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified) and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))) then raise exception 'provider_not_eligible'; end if;
  insert into public.marketplace_quotes(job_id, provider_id, amount_pence, availability_type, available_at, availability_text, message)
  values(target_job, auth.uid(), quote_amount, quote_availability, quote_available_at, quote_availability_text, quote_message)
  on conflict(job_id, provider_id) do update set amount_pence = excluded.amount_pence, availability_type = excluded.availability_type, available_at = excluded.available_at, availability_text = excluded.availability_text, message = excluded.message, status = 'submitted', updated_at = now()
  returning * into result;
  update public.marketplace_jobs set status = 'finding_provider', updated_at = now() where id = target_job and status = 'posted';
  return result;
end; $$;
revoke all on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) from public, anon;
grant execute on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) to authenticated;

create or replace function public.select_marketplace_quote(target_token uuid, target_quote uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare j public.marketplace_jobs; q public.marketplace_quotes; result public.marketplace_bookings;
begin
  select * into j from public.marketplace_jobs where public_token = target_token for update;
  select * into q from public.marketplace_quotes where id = target_quote and job_id = j.id and status = 'submitted';
  if j.id is null or q.id is null or j.status not in ('posted', 'finding_provider') then raise exception 'quote_selection_unavailable'; end if;
  update public.marketplace_quotes set status = 'declined', updated_at = now() where job_id = j.id and id <> q.id and status = 'submitted';
  update public.marketplace_quotes set status = 'selected', updated_at = now() where id = q.id;
  insert into public.marketplace_bookings(job_id, quote_id, customer_id, provider_id, quoted_service_price_pence, booking_fee_pence)
  values(j.id, q.id, j.customer_id, q.provider_id, q.amount_pence, j.booking_fee_pence)
  on conflict(job_id) do update set quote_id = excluded.quote_id
  returning * into result;
  update public.marketplace_jobs set status = 'awaiting_booking', updated_at = now() where id = j.id;
  return result;
end; $$;
revoke all on function public.select_marketplace_quote(uuid, uuid) from public, anon;
grant execute on function public.select_marketplace_quote(uuid, uuid) to service_role;

create or replace function public.get_marketplace_opportunities()
returns table(id uuid, category_slug text, job_type_slug text, structured_answers jsonb, postcode_district text, requested_timing text, optional_note text, photo_count bigint, status text)
language sql security definer set search_path = public
as $$
  select j.id, j.service, j.service_subtype, j.pricing_answers,
    upper(split_part(trim(j.postcode), ' ', 1)), j.requested_timing, j.optional_note,
    (select count(*) from public.marketplace_job_photos p where p.job_id = j.id), j.status
  from public.marketplace_jobs j
  where j.status in ('posted', 'finding_provider')
    and exists (select 1 from public.marketplace_provider_services ps join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id where ps.provider_id = auth.uid() and ps.active and pa.active and ps.category_slug = j.service and ps.job_type_slug = j.service_subtype and (j.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified) and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1)));
$$;
revoke all on function public.get_marketplace_opportunities() from public, anon;
grant execute on function public.get_marketplace_opportunities() to authenticated;

insert into storage.buckets (id, name, public) values ('marketplace-job-photos', 'marketplace-job-photos', false) on conflict (id) do nothing;
create policy "eligible providers read marketplace job photos" on storage.objects for select to authenticated using (bucket_id = 'marketplace-job-photos' and exists (select 1 from public.marketplace_job_photos p join public.marketplace_jobs j on j.id = p.job_id join public.marketplace_provider_services ps on ps.category_slug = j.service and ps.job_type_slug = j.service_subtype join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id where p.storage_path = name and ps.provider_id = auth.uid() and ps.active and pa.active and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))));
