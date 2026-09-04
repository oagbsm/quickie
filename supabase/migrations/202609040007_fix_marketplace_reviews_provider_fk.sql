-- Repair the review provider FK missed because marketplace_reviews was created
-- after the marketplace provider decoupling migration. provider_id stores the
-- auth user UUID, which is marketplace_providers.user_id.

do $$
declare
  incompatible_count bigint;
begin
  select count(*)
    into incompatible_count
  from public.marketplace_reviews r
  where not exists (
    select 1
    from public.marketplace_providers p
    where p.user_id = r.provider_id
  );

  if incompatible_count > 0 then
    raise exception 'marketplace_reviews contains % provider_id value(s) not present in marketplace_providers.user_id', incompatible_count;
  end if;
end $$;

do $$
declare
  constraint_name text;
begin
  select con.conname
    into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  join pg_class frel on frel.oid = con.confrelid
  where con.contype = 'f'
    and nsp.nspname = 'public'
    and rel.relname = 'marketplace_reviews'
    and frel.relname = 'cleaner_profiles'
    and exists (
      select 1
      from unnest(con.conkey) as key(attnum)
      join pg_attribute a on a.attrelid = rel.oid and a.attnum = key.attnum
      where a.attname = 'provider_id'
    )
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.marketplace_reviews drop constraint %I', constraint_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class frel on frel.oid = con.confrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where con.contype = 'f'
      and nsp.nspname = 'public'
      and rel.relname = 'marketplace_reviews'
      and frel.relname = 'marketplace_providers'
      and exists (
        select 1
        from unnest(con.conkey) as key(attnum)
        join pg_attribute a on a.attrelid = rel.oid and a.attnum = key.attnum
        where a.attname = 'provider_id'
      )
  ) then
    alter table public.marketplace_reviews
      add constraint marketplace_reviews_provider_id_fkey
      foreign key (provider_id)
      references public.marketplace_providers(user_id)
      on delete cascade;
  end if;
end $$;
