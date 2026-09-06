-- The marketplace provider identity is marketplace_providers.user_id.
-- Keep provider history and financial/job records when a provider is removed.
alter table public.marketplace_quotes
  drop constraint if exists marketplace_quotes_provider_id_fkey;

alter table public.marketplace_quotes
  add constraint marketplace_quotes_provider_id_marketplace_providers_fkey
  foreign key (provider_id)
  references public.marketplace_providers(user_id);

alter table public.marketplace_provider_status_history
  drop constraint if exists marketplace_provider_status_history_provider_id_fkey;

alter table public.marketplace_provider_status_history
  add constraint marketplace_provider_status_history_provider_id_marketplace_providers_fkey
  foreign key (provider_id)
  references public.marketplace_providers(user_id);
