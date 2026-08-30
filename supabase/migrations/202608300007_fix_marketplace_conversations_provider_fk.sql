alter table public.marketplace_conversations
drop constraint if exists marketplace_conversations_provider_id_fkey;

alter table public.marketplace_conversations
add constraint marketplace_conversations_provider_id_fkey
foreign key (provider_id)
references public.marketplace_providers(user_id)
on delete cascade;
