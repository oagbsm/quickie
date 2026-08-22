create or replace function public.marketplace_provider_can_operate(provider_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cleaner_profiles
    where user_id = provider_user
      and provider_status = 'approved'
      and stripe_status = 'ready'
      and marketplace_active = true
  );
$$;

drop policy if exists "providers view eligible marketplace jobs" on public.marketplace_jobs;
create policy "providers view eligible marketplace jobs" on public.marketplace_jobs for select to authenticated using (
  public.marketplace_provider_can_operate(auth.uid())
  and status in ('posted', 'finding_provider') and exists (
    select 1 from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = auth.uid() and ps.active and pa.active
      and ps.category_slug = marketplace_jobs.service
      and ps.job_type_slug = marketplace_jobs.service_subtype
      and (marketplace_jobs.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
      and upper(pa.postcode_district) = upper(split_part(trim(marketplace_jobs.postcode), ' ', 1))
  )
);

drop policy if exists "providers view photos for eligible jobs" on storage.objects;
create policy "providers view photos for eligible jobs" on storage.objects for select to authenticated using (
  bucket_id = 'marketplace-job-photos' and public.marketplace_provider_can_operate(auth.uid()) and exists (
    select 1 from public.marketplace_job_photos p
    join public.marketplace_jobs j on j.id = p.job_id
    join public.marketplace_provider_services ps on ps.category_slug = j.service and ps.job_type_slug = j.service_subtype
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where p.storage_path = name and ps.provider_id = auth.uid() and ps.active and pa.active
      and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))
  )
);

create or replace function public.submit_marketplace_quote(target_job uuid, quote_amount integer, quote_availability text, quote_available_at timestamptz default null, quote_availability_text text default null, quote_message text default null)
returns public.marketplace_quotes language plpgsql security definer set search_path = public
as $$
declare j public.marketplace_jobs; result public.marketplace_quotes;
begin
  if not public.marketplace_provider_can_operate(auth.uid()) then raise exception 'provider_not_ready'; end if;
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

create or replace function public.get_marketplace_opportunities()
returns table(id uuid, category_slug text, job_type_slug text, structured_answers jsonb, postcode_district text, requested_timing text, optional_note text, photo_count bigint, status text)
language sql security definer set search_path = public
as $$
  select j.id, j.service, j.service_subtype, j.pricing_answers, upper(split_part(trim(j.postcode), ' ', 1)), j.requested_timing, j.optional_note, (select count(*) from public.marketplace_job_photos p where p.job_id = j.id), j.status
  from public.marketplace_jobs j
  where public.marketplace_provider_can_operate(auth.uid())
    and j.status in ('posted', 'finding_provider')
    and exists (select 1 from public.marketplace_provider_services ps join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id where ps.provider_id = auth.uid() and ps.active and pa.active and ps.category_slug = j.service and ps.job_type_slug = j.service_subtype and (j.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified) and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1)));
$$;
