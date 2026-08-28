create or replace function public.marketplace_launch_postcode_districts()
returns table(postcode_district text)
language sql
immutable
as $$ select 'SL6'::text $$;

create or replace function public.marketplace_provider_can_browse(provider_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cleaner_profiles p
    join auth.users u on u.id = p.user_id
    where p.user_id = provider_user
      and p.provider_status <> 'suspended'
      and u.email_confirmed_at is not null
      and coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.business_name), '')) is not null
      and nullif(trim(p.phone), '') is not null
      and p.provider_type in ('individual', 'business')
      and exists (
        select 1 from public.marketplace_provider_services ps
        where ps.provider_id = provider_user and ps.active
      )
  );
$$;

create or replace function public.get_marketplace_browse_opportunities()
returns table(id uuid, category_slug text, job_type_slug text, structured_answers jsonb, postcode_district text, requested_timing text, optional_note text, photo_count bigint, status text)
language sql
security definer
set search_path = public
as $$
  select j.id, j.service, j.service_subtype, j.pricing_answers,
    upper(split_part(trim(j.postcode), ' ', 1)), j.requested_timing,
    j.optional_note,
    (select count(*) from public.marketplace_job_photos p where p.job_id = j.id),
    j.status
  from public.marketplace_jobs j
  where public.marketplace_provider_can_browse(auth.uid())
    and j.status in ('posted', 'finding_provider')
    and upper(split_part(trim(j.postcode), ' ', 1)) in (select postcode_district from public.marketplace_launch_postcode_districts())
    and exists (
      select 1
      from public.marketplace_provider_services ps
      where ps.provider_id = auth.uid()
        and ps.active
        and ps.category_slug = j.service
        and ps.job_type_slug = j.service_subtype
    );
$$;

revoke all on function public.marketplace_provider_can_browse(uuid) from public, anon;
grant execute on function public.marketplace_provider_can_browse(uuid) to authenticated;
revoke all on function public.get_marketplace_browse_opportunities() from public, anon;
grant execute on function public.get_marketplace_browse_opportunities() to authenticated;
