alter table public.marketplace_bookings
drop constraint if exists marketplace_bookings_provider_id_fkey;

alter table public.marketplace_bookings
add constraint marketplace_bookings_provider_id_fkey
foreign key (provider_id)
references public.marketplace_providers(user_id)
on delete cascade;
