do $$
begin
  if exists (
    select 1
    from public.marketplace_provider_service_areas a
    left join public.marketplace_providers p
      on p.user_id = a.provider_id
    where p.user_id is null
  ) then
    raise exception 'Cannot replace provider service-area FK: orphan provider_id rows exist';
  end if;
end
$$;

alter table public.marketplace_provider_service_areas
  drop constraint if exists marketplace_provider_service_areas_provider_id_fkey;

alter table public.marketplace_provider_service_areas
  add constraint marketplace_provider_service_areas_provider_id_fkey
  foreign key (provider_id)
  references public.marketplace_providers(user_id)
  on delete cascade;
