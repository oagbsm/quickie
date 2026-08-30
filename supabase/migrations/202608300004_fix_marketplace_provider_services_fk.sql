-- Repair stale marketplace provider identity foreign keys after provider decoupling.
-- Provider IDs remain auth.users IDs and are keyed by marketplace_providers.user_id.
-- This migration never deletes, remaps, or cascades data.

do $$
declare
  fk record;
  rewritten_definition text;
  orphan_count bigint;
begin
  if to_regclass('public.marketplace_providers') is null then
    raise exception 'marketplace_providers is required before repairing marketplace provider foreign keys';
  end if;

  for fk in
    select
      c.oid,
      c.conname,
      c.conrelid,
      c.conrelid::regclass as child_table,
      a.attname as child_column,
      c.confrelid::regclass as parent_table,
      pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = c.conkey[1]
     and not a.attisdropped
    join pg_attribute parent_key
      on parent_key.attrelid = c.confrelid
     and parent_key.attnum = c.confkey[1]
     and parent_key.attname = 'user_id'
     and not parent_key.attisdropped
    where c.contype = 'f'
      and c.conrelid::regclass::text like 'public.marketplace_%'
      and c.conkey is not null
      and array_length(c.conkey, 1) = 1
      and a.attname = 'provider_id'
      and c.confrelid::regclass::text in (
        'public.cleaner_profiles',
        'public.workers',
        'public.business_members'
      )
  loop
    execute format(
      'select count(*) from %s child left join public.marketplace_providers provider on provider.user_id = child.provider_id where child.provider_id is not null and provider.user_id is null',
      fk.child_table
    ) into orphan_count;

    if orphan_count > 0 then
      raise exception
        'Cannot repair %.%: % orphan provider_id value(s) are not present in public.marketplace_providers',
        fk.child_table,
        fk.child_column,
        orphan_count;
    end if;

    rewritten_definition := regexp_replace(
      fk.definition,
      E'REFERENCES public\\.(cleaner_profiles|workers|business_members)\\s*\\(\\s*user_id\\s*\\)',
      'REFERENCES public.marketplace_providers(user_id)',
      1,
      1,
      'i'
    );

    if rewritten_definition = fk.definition then
      raise exception 'Cannot safely rewrite %.% constraint %', fk.child_table, fk.child_column, fk.conname;
    end if;

    execute format('alter table %s drop constraint %I', fk.child_table, fk.conname);
    execute format('alter table %s add constraint %I %s', fk.child_table, fk.conname, rewritten_definition);

    raise notice 'Repaired %.% constraint % from % to marketplace_providers.user_id',
      fk.child_table, fk.child_column, fk.conname, fk.parent_table;
  end loop;
end;
$$;
