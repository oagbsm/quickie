alter table public.property_calendar_connections
  drop constraint if exists property_calendar_connections_provider_check;

alter table public.property_calendar_connections
  add constraint property_calendar_connections_provider_check
  check (provider in ('airbnb', 'booking_com', 'vrbo', 'expedia', 'other'));

create or replace function public.create_property_calendar_connection(
  target_property uuid,
  selected_provider text,
  selected_display_name text,
  encrypted_url text,
  url_fingerprint text,
  masked_url text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  account uuid;
  connection_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select account_id into account from public.properties
  where id = target_property and status = 'active';
  if account is null or not public.is_business_member(account) then
    raise exception 'property_not_found';
  end if;
  if selected_provider not in ('airbnb', 'booking_com', 'vrbo', 'expedia', 'other')
    or url_fingerprint !~ '^[0-9a-f]{64}$'
    or char_length(encrypted_url) < 20 then
    raise exception 'invalid_calendar_connection';
  end if;
  begin
    insert into public.property_calendar_connections(
      account_id, property_id, provider, display_name,
      calendar_url_encrypted, calendar_url_fingerprint, masked_calendar_url,
      created_by
    ) values (
      account, target_property, selected_provider,
      nullif(trim(selected_display_name), ''), encrypted_url, url_fingerprint,
      masked_url, actor
    ) returning id into connection_id;
  exception when unique_violation then
    raise exception 'duplicate_calendar_connection';
  end;
  insert into public.activity_events(
    account_id, property_id, actor_user_id, event_type, description, metadata
  ) values (
    account, target_property, actor, 'calendar_connected',
    'Reservation calendar connected', jsonb_build_object('provider', selected_provider)
  );
  return connection_id;
end $$;
