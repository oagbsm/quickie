alter table public.marketplace_provider_services
  drop constraint if exists marketplace_provider_services_provider_id_fkey;

alter table public.marketplace_provider_services
  add constraint marketplace_provider_services_provider_id_fkey
  foreign key (provider_id)
  references public.marketplace_providers(user_id)
  on delete cascade;
