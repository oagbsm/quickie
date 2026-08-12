-- Fix the cleaner-created work-item idempotency lookup. The previous function
-- used `creation_key` for both a PL/pgSQL parameter and a work_items column,
-- which made the unqualified WHERE expression ambiguous at runtime.
-- PostgreSQL does not allow CREATE OR REPLACE to rename input parameters, so
-- replace the same-signature function explicitly inside this migration.
drop function if exists public.create_cleaner_work_item(uuid,text,date,timestamptz,timestamptz,timestamptz,text,text,text,text);
create or replace function public.create_cleaner_work_item(
  target_property uuid,
  p_creation_key text,
  clean_date date,
  clean_start timestamptz,
  clean_end timestamptz,
  guest_checkin timestamptz default null,
  clean_notes text default null,
  clean_host_name text default null,
  clean_host_email text default null,
  clean_host_phone text default null
) returns public.work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  account uuid;
  property_row public.properties;
  result public.work_items;
  checkin timestamptz;
  checkout timestamptz;
  duration integer;
  normalized_creation_key text := nullif(trim(p_creation_key), '');
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  perform public.initialize_direct_cleaner_profile();

  select * into property_row
  from public.properties as owned_property
  where owned_property.id = target_property
    and owned_property.standalone_cleaner_user_id = current_user_id
  for update;
  if property_row.id is null then raise exception 'property_not_owned'; end if;

  -- Idempotency is preserved and every identifier is explicit.
  if normalized_creation_key is not null then
    select existing_item.* into result
    from public.work_items as existing_item
    where existing_item.standalone_cleaner_user_id = current_user_id
      and existing_item.creation_key = normalized_creation_key;
    if result.id is not null then return result; end if;
  end if;

  if clean_start is null or clean_end is null or clean_end <= clean_start then
    raise exception 'clean_window_invalid';
  end if;
  checkin := coalesce(guest_checkin, clean_end + interval '1 minute');
  checkout := clean_start - interval '1 minute';
  duration := greatest(15, ceil(extract(epoch from (clean_end - clean_start)) / 60)::integer);
  select profile.workspace_account_id into account
  from public.cleaner_profiles as profile
  where profile.user_id = current_user_id;

  insert into public.work_items(
    account_id, property_id, standalone_cleaner_user_id, creation_key,
    property_public_name, property_general_area, cleaning_type, turnover_date,
    guest_checkout_at, access_start_at, window_end_at, next_checkin_at,
    estimated_duration_minutes, notes, required_evidence_count, risk_acknowledged,
    status, created_by, host_name, host_email, host_phone
  ) values (
    account, property_row.id, current_user_id, normalized_creation_key,
    property_row.nickname, coalesce(nullif(property_row.postcode, ''), property_row.city),
    'standard_turnover', clean_date, checkout, clean_start, clean_end, checkin,
    duration, nullif(trim(clean_notes), ''), property_row.required_completion_photos,
    true, 'accepted', current_user_id, nullif(trim(clean_host_name), ''),
    nullif(lower(trim(clean_host_email)), ''), nullif(trim(clean_host_phone), '')
  ) returning * into result;

  perform public.snapshot_work_item_checklist(result.id);
  insert into public.activity_events(account_id, work_item_id, property_id, actor_user_id, event_type, description)
  values (account, result.id, result.property_id, current_user_id, 'cleaner_clean_created', 'Cleaner added a clean');
  return result;
exception when unique_violation then
  if normalized_creation_key is not null then
    select existing_item.* into result
    from public.work_items as existing_item
    where existing_item.standalone_cleaner_user_id = current_user_id
      and existing_item.creation_key = normalized_creation_key;
    if result.id is not null then return result; end if;
  end if;
  raise exception 'clean_already_exists';
end;
$$;

revoke all on function public.create_cleaner_work_item(uuid,text,date,timestamptz,timestamptz,timestamptz,text,text,text,text) from public, anon;
grant execute on function public.create_cleaner_work_item(uuid,text,date,timestamptz,timestamptz,timestamptz,text,text,text,text) to authenticated;
