-- Keep qualification_verified for future admin workflows, but do not make an
-- unimplemented provider-facing check a quote or opportunity requirement.
create or replace function public.submit_marketplace_quote(target_job uuid, quote_amount integer, quote_availability text, quote_available_at timestamptz default null, quote_availability_text text default null, quote_message text default null)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  j public.marketplace_jobs;
  result public.marketplace_quotes;
begin
  select * into j from public.marketplace_jobs where id = target_job for update;
  if j.id is null or j.status not in ('posted', 'finding_provider') then
    raise exception 'job_not_open_or_booked';
  end if;
  if exists (select 1 from public.marketplace_quotes where job_id = target_job and status in ('accepted', 'selected')) then
    raise exception 'job_already_booked';
  end if;
  if not exists (
    select 1
    from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = auth.uid()
      and ps.active and pa.active
      and ps.category_slug = j.service
      and ps.job_type_slug = j.service_subtype
      and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))
  ) then
    raise exception 'provider_not_eligible';
  end if;

  select * into result
  from public.marketplace_quotes
  where job_id = target_job and coalesce(provider_id, bidder_user_id) = auth.uid()
  for update;

  if result.id is not null and result.status in ('accepted', 'selected') then
    raise exception 'offer_locked_after_acceptance';
  end if;

  if result.id is not null then
    insert into public.marketplace_quote_history(quote_id, job_id, provider_user_id, amount_pence, availability_text, message, status)
    values (result.id, result.job_id, auth.uid(), result.amount_pence, result.availability_text, result.message, 'superseded');
    update public.marketplace_quotes
    set amount_pence = quote_amount, availability_type = quote_availability,
        available_at = quote_available_at, availability_text = quote_availability_text,
        message = quote_message, status = 'submitted', updated_at = now()
    where id = result.id returning * into result;
  else
    insert into public.marketplace_quotes(job_id, provider_id, bidder_user_id, amount_pence, availability_type, available_at, availability_text, message, status)
    values (target_job, case when exists (select 1 from public.cleaner_profiles where user_id = auth.uid()) then auth.uid() else null end,
      auth.uid(), quote_amount, quote_availability, quote_available_at, quote_availability_text, quote_message, 'submitted')
    returning * into result;
  end if;

  update public.marketplace_jobs set status = 'finding_provider', updated_at = now()
  where id = target_job and status = 'posted';
  return result;
end;
$$;

revoke all on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) from public, anon;
grant execute on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) to authenticated;

create or replace function public.get_marketplace_opportunities()
returns table(id uuid, category_slug text, job_type_slug text, structured_answers jsonb, postcode_district text, requested_timing text, optional_note text, photo_count bigint, status text)
language sql security definer set search_path = public
as $$
  select j.id, j.service, j.service_subtype, j.pricing_answers,
    upper(split_part(trim(j.postcode), ' ', 1)), j.requested_timing, j.optional_note,
    (select count(*) from public.marketplace_job_photos p where p.job_id = j.id), j.status
  from public.marketplace_jobs j
  where public.marketplace_provider_can_operate(auth.uid())
    and j.status in ('posted', 'finding_provider')
    and exists (
      select 1 from public.marketplace_provider_services ps
      join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
      where ps.provider_id = auth.uid() and ps.active and pa.active
        and ps.category_slug = j.service and ps.job_type_slug = j.service_subtype
        and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))
    );
$$;

revoke all on function public.get_marketplace_opportunities() from public, anon;
grant execute on function public.get_marketplace_opportunities() to authenticated;
