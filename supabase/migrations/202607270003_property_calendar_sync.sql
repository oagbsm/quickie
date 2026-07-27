-- Sprint 1B: secure property calendar connections and iCalendar reconciliation.
-- Sprint 1A reservations and linked work_items remain the canonical lifecycle.

create table public.property_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  property_id uuid not null,
  provider text not null check (provider in ('airbnb','booking_com','vrbo','other')),
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  calendar_url_encrypted text not null,
  calendar_url_fingerprint text not null check (calendar_url_fingerprint ~ '^[0-9a-f]{64}$'),
  masked_calendar_url text not null,
  is_active boolean not null default true,
  sync_status text not null default 'never_synced'
    check (sync_status in ('never_synced','syncing','healthy','attention_required','disabled')),
  last_sync_started_at timestamptz,
  last_successful_sync_at timestamptz,
  last_sync_completed_at timestamptz,
  last_error_code text,
  last_error_message text,
  consecutive_failure_count integer not null default 0 check (consecutive_failure_count >= 0),
  last_feed_fingerprint text,
  last_sync_summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_calendar_connection_property_fk
    foreign key(property_id, account_id)
    references public.properties(id, account_id) on delete cascade
);

create unique index property_calendar_connection_url_unique
  on public.property_calendar_connections(property_id, calendar_url_fingerprint)
  where removed_at is null;
create index property_calendar_connections_property_idx
  on public.property_calendar_connections(account_id, property_id, created_at);
create index property_calendar_connections_due_idx
  on public.property_calendar_connections(is_active, last_successful_sync_at)
  where removed_at is null and is_active;

alter table public.reservations
  add column if not exists source_connection_id uuid,
  add column if not exists external_uid text,
  add column if not exists external_event_fingerprint text,
  add column if not exists external_sequence integer,
  add column if not exists external_last_modified_at timestamptz,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists source_status text,
  add column if not exists missing_sync_count integer not null default 0;

alter table public.reservations
  add constraint reservations_source_connection_fk
    foreign key(source_connection_id)
    references public.property_calendar_connections(id) on delete restrict,
  add constraint reservations_ical_identity_state check (
    (source = 'ical' and source_connection_id is not null and external_uid is not null)
    or (source <> 'ical' and source_connection_id is null)
  ),
  add constraint reservations_missing_sync_count_check check (missing_sync_count >= 0);

create unique index reservations_ical_external_identity_unique
  on public.reservations(source_connection_id, external_uid)
  where source_connection_id is not null;
create index reservations_ical_missing_idx
  on public.reservations(source_connection_id, missing_sync_count)
  where source = 'ical' and status <> 'cancelled';

create table public.reservation_sync_issues (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  connection_id uuid not null references public.property_calendar_connections(id) on delete cascade,
  property_id uuid not null,
  external_uid_hash text,
  issue_type text not null check (issue_type in (
    'overlap_conflict','invalid_event','calendar_unavailable',
    'suspicious_empty_feed','duplicate_source','sync_failure'
  )),
  issue_status text not null default 'open' check (issue_status in ('open','resolved')),
  safe_message text not null check (char_length(safe_message) between 1 and 500),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reservation_sync_issue_property_fk
    foreign key(property_id, account_id)
    references public.properties(id, account_id) on delete cascade
);
create index reservation_sync_issues_open_idx
  on public.reservation_sync_issues(account_id, property_id, last_seen_at desc)
  where issue_status = 'open';

alter table public.property_calendar_connections enable row level security;
alter table public.reservation_sync_issues enable row level security;

create policy "members view calendar sync issues"
  on public.reservation_sync_issues for select to authenticated
  using (public.is_business_member(account_id));

revoke all on public.property_calendar_connections from anon, authenticated;
revoke all on public.reservation_sync_issues from anon, authenticated;
grant select on public.reservation_sync_issues to authenticated;

create or replace view public.property_calendar_connections_safe
with (security_barrier = true) as
select
  id, account_id, property_id, provider, display_name, masked_calendar_url,
  is_active, sync_status, last_sync_started_at, last_successful_sync_at,
  last_sync_completed_at, last_error_code, last_error_message,
  consecutive_failure_count, last_sync_summary, created_at, updated_at
from public.property_calendar_connections
where removed_at is null and public.is_business_member(account_id);
revoke all on public.property_calendar_connections_safe from public, anon;
grant select on public.property_calendar_connections_safe to authenticated;

create or replace function public.calendar_connection_authorised(target_account uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_business_member(target_account)
    or coalesce(auth.role(), '') = 'service_role'
$$;
revoke all on function public.calendar_connection_authorised(uuid) from public, anon;

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
  if selected_provider not in ('airbnb','booking_com','vrbo','other')
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
revoke all on function public.create_property_calendar_connection(uuid,text,text,text,text,text)
  from public, anon;
grant execute on function public.create_property_calendar_connection(uuid,text,text,text,text,text)
  to authenticated;

create or replace function public.manage_property_calendar_connection(
  target_connection uuid,
  requested_action text,
  next_display_name text default null,
  next_encrypted_url text default null,
  next_url_fingerprint text default null,
  next_masked_url text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare connection public.property_calendar_connections;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null for update;
  if connection.id is null or not public.is_business_member(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  if requested_action = 'rename' then
    update public.property_calendar_connections
    set display_name = nullif(trim(next_display_name), ''), updated_at = clock_timestamp()
    where id = connection.id;
  elsif requested_action = 'disable' then
    update public.property_calendar_connections
    set is_active = false, sync_status = 'disabled', updated_at = clock_timestamp()
    where id = connection.id;
  elsif requested_action = 'enable' then
    update public.property_calendar_connections
    set is_active = true, sync_status = 'never_synced', last_error_code = null,
      last_error_message = null, updated_at = clock_timestamp()
    where id = connection.id;
  elsif requested_action = 'replace_url' then
    begin
      update public.property_calendar_connections
      set calendar_url_encrypted = next_encrypted_url,
        calendar_url_fingerprint = next_url_fingerprint,
        masked_calendar_url = next_masked_url,
        sync_status = 'never_synced', last_error_code = null,
        last_error_message = null, consecutive_failure_count = 0,
        updated_at = clock_timestamp()
      where id = connection.id;
    exception when unique_violation then
      raise exception 'duplicate_calendar_connection';
    end;
  elsif requested_action = 'remove' then
    update public.property_calendar_connections
    set is_active = false, sync_status = 'disabled', removed_at = clock_timestamp(),
      calendar_url_encrypted = 'removed', updated_at = clock_timestamp()
    where id = connection.id;
  else
    raise exception 'invalid_calendar_connection_action';
  end if;
  if requested_action in ('disable','enable','remove') then
    insert into public.activity_events(
      account_id, property_id, actor_user_id, event_type, description, metadata
    ) values (
      connection.account_id, connection.property_id, auth.uid(),
      'calendar_' || requested_action,
      case requested_action
        when 'disable' then 'Reservation calendar disabled'
        when 'enable' then 'Reservation calendar re-enabled'
        else 'Reservation calendar removed'
      end,
      jsonb_build_object('provider', connection.provider)
    );
  end if;
end $$;
revoke all on function public.manage_property_calendar_connection(uuid,text,text,text,text,text)
  from public, anon;
grant execute on function public.manage_property_calendar_connection(uuid,text,text,text,text,text)
  to authenticated;

create or replace function public.claim_property_calendar_sync(target_connection uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare connection public.property_calendar_connections;
declare property public.properties;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null for update;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  if not connection.is_active then raise exception 'calendar_connection_disabled'; end if;
  if connection.sync_status = 'syncing'
    and connection.last_sync_started_at > clock_timestamp() - interval '10 minutes' then
    raise exception 'calendar_sync_in_progress';
  end if;
  update public.property_calendar_connections
  set sync_status = 'syncing', last_sync_started_at = clock_timestamp(),
    last_sync_completed_at = null, updated_at = clock_timestamp()
  where id = connection.id;
  select * into property from public.properties where id = connection.property_id;
  return jsonb_build_object(
    'id', connection.id, 'account_id', connection.account_id,
    'property_id', connection.property_id, 'provider', connection.provider,
    'encrypted_url', connection.calendar_url_encrypted,
    'default_checkin_time', property.default_checkin_time,
    'default_checkout_time', property.default_checkout_time,
    'last_feed_fingerprint', connection.last_feed_fingerprint,
    'active_reservation_count', (
      select count(*) from public.reservations reservation
      where reservation.source_connection_id = connection.id
        and reservation.status <> 'cancelled'
    )
  );
end $$;
revoke all on function public.claim_property_calendar_sync(uuid) from public, anon;
grant execute on function public.claim_property_calendar_sync(uuid) to authenticated, service_role;

create or replace function public.reconcile_ical_reservation(
  target_connection uuid,
  event_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  connection public.property_calendar_connections;
  existing public.reservations;
  saved public.reservations;
  actor uuid;
  uid text := event_payload->>'external_uid';
  check_in timestamptz;
  check_out timestamptz;
  event_status text := coalesce(event_payload->>'status', 'confirmed');
  event_fingerprint text := event_payload->>'fingerprint';
  event_sequence integer;
  event_modified timestamptz;
  turnover_id uuid;
  action text;
  previous_values jsonb := '{}'::jsonb;
  new_values jsonb := '{}'::jsonb;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  actor := coalesce(
    auth.uid(),
    connection.created_by,
    (
      select member.user_id
      from public.business_members member
      where member.account_id = connection.account_id
      order by case member.role when 'owner' then 0 when 'manager' then 1 else 2 end,
        member.created_at, member.user_id
      limit 1
    )
  );
  if actor is null then raise exception 'calendar_sync_actor_unavailable'; end if;
  begin
    check_in := (event_payload->>'check_in_at')::timestamptz;
    check_out := (event_payload->>'check_out_at')::timestamptz;
    event_sequence := nullif(event_payload->>'sequence', '')::integer;
    event_modified := nullif(event_payload->>'external_last_modified_at', '')::timestamptz;
  exception when others then raise exception 'invalid_calendar_event'; end;
  if uid is null or check_out <= check_in
    or event_status not in ('confirmed','cancelled') then
    raise exception 'invalid_calendar_event';
  end if;

  select * into existing from public.reservations
  where source_connection_id = connection.id and external_uid = uid for update;
  if existing.id is null and event_status = 'cancelled' then
    return jsonb_build_object('action', 'unchanged');
  end if;
  if existing.id is not null and (
    (
      event_sequence is not null and existing.external_sequence is not null
      and event_sequence < existing.external_sequence
    ) or (
      event_modified is not null and existing.external_last_modified_at is not null
      and event_sequence is not distinct from existing.external_sequence
      and event_modified < existing.external_last_modified_at
    )
  ) then
    update public.reservations
    set last_seen_at = clock_timestamp(), missing_sync_count = 0
    where id = existing.id;
    return jsonb_build_object('action', 'unchanged', 'reservation_id', existing.id);
  end if;

  if existing.id is null then
    insert into public.reservations(
      account_id, property_id, source, external_reservation_id,
      guest_name, check_in_at, check_out_at, status, source_updated_at,
      source_connection_id, external_uid, external_event_fingerprint,
      external_sequence, external_last_modified_at, first_seen_at,
      last_seen_at, source_status, missing_sync_count
    ) values (
      connection.account_id, connection.property_id, 'ical',
      'ical:' || connection.id::text || ':' || encode(extensions.digest(uid, 'sha256'), 'hex'),
      null, check_in, check_out, 'confirmed', event_modified,
      connection.id, uid, event_fingerprint, event_sequence, event_modified,
      clock_timestamp(), clock_timestamp(), 'confirmed', 0
    ) returning * into saved;
    perform public.record_reservation_event(
      saved.account_id, saved.id, null, 'reservation.imported', '{}'::jsonb,
      jsonb_build_object('check_in_at', saved.check_in_at, 'check_out_at', saved.check_out_at),
      jsonb_build_object('provider', connection.provider), actor
    );
    perform set_config('quickola.reservation_sync', 'on', true);
    turnover_id := public.sync_turnover_for_reservation(saved.id, actor);
    perform public.refresh_reservation_turnovers_for_property(
      saved.account_id, saved.property_id, actor
    );
    return jsonb_build_object(
      'action', 'imported', 'reservation_id', saved.id, 'turnover_id', turnover_id
    );
  end if;

  if event_status = 'cancelled' then
    if existing.status = 'cancelled' then
      update public.reservations set last_seen_at = clock_timestamp(),
        missing_sync_count = 0, external_event_fingerprint = event_fingerprint,
        external_sequence = event_sequence, external_last_modified_at = event_modified,
        source_status = 'cancelled'
      where id = existing.id;
      return jsonb_build_object('action', 'unchanged', 'reservation_id', existing.id);
    end if;
    update public.reservations set status = 'cancelled', source_status = 'cancelled',
      cancelled_at = clock_timestamp(), last_seen_at = clock_timestamp(),
      missing_sync_count = 0, external_event_fingerprint = event_fingerprint,
      external_sequence = event_sequence, external_last_modified_at = event_modified,
      updated_at = clock_timestamp()
    where id = existing.id returning * into saved;
    select id into turnover_id from public.work_items where reservation_id = existing.id;
    perform public.record_reservation_event(
      saved.account_id, saved.id, turnover_id, 'reservation.cancelled',
      jsonb_build_object('status', existing.status), jsonb_build_object('status', 'cancelled'),
      jsonb_build_object('origin', 'calendar', 'provider', connection.provider), actor
    );
    perform set_config('quickola.reservation_sync', 'on', true);
    turnover_id := public.sync_turnover_for_reservation(saved.id, actor);
    perform public.refresh_reservation_turnovers_for_property(
      saved.account_id, saved.property_id, actor
    );
    return jsonb_build_object(
      'action', 'cancelled', 'reservation_id', saved.id, 'turnover_id', turnover_id
    );
  end if;

  if existing.status = 'cancelled' then
    return jsonb_build_object('action', 'unchanged', 'reservation_id', existing.id);
  end if;
  if existing.check_in_at is distinct from check_in then
    previous_values := previous_values || jsonb_build_object('check_in_at', existing.check_in_at);
    new_values := new_values || jsonb_build_object('check_in_at', check_in);
  end if;
  if existing.check_out_at is distinct from check_out then
    previous_values := previous_values || jsonb_build_object('check_out_at', existing.check_out_at);
    new_values := new_values || jsonb_build_object('check_out_at', check_out);
  end if;
  if new_values = '{}'::jsonb then
    update public.reservations set last_seen_at = clock_timestamp(),
      missing_sync_count = 0, external_event_fingerprint = event_fingerprint,
      external_sequence = event_sequence, external_last_modified_at = event_modified,
      source_updated_at = event_modified, source_status = 'confirmed'
    where id = existing.id;
    return jsonb_build_object('action', 'unchanged', 'reservation_id', existing.id);
  end if;
  update public.reservations set check_in_at = check_in, check_out_at = check_out,
    last_seen_at = clock_timestamp(), missing_sync_count = 0,
    external_event_fingerprint = event_fingerprint, external_sequence = event_sequence,
    external_last_modified_at = event_modified, source_updated_at = event_modified,
    source_status = 'confirmed', updated_at = clock_timestamp()
  where id = existing.id returning * into saved;
  select id into turnover_id from public.work_items where reservation_id = existing.id;
  perform public.record_reservation_event(
    saved.account_id, saved.id, turnover_id, 'reservation.updated',
    previous_values, new_values,
    jsonb_build_object('origin', 'calendar', 'provider', connection.provider), actor
  );
  perform set_config('quickola.reservation_sync', 'on', true);
  turnover_id := public.sync_turnover_for_reservation(saved.id, actor);
  perform public.refresh_reservation_turnovers_for_property(
    saved.account_id, saved.property_id, actor
  );
  return jsonb_build_object(
    'action', 'updated', 'reservation_id', saved.id, 'turnover_id', turnover_id
  );
end $$;
revoke all on function public.reconcile_ical_reservation(uuid,jsonb) from public, anon;
grant execute on function public.reconcile_ical_reservation(uuid,jsonb)
  to authenticated, service_role;

create or replace function public.finalize_ical_missing_reservations(
  target_connection uuid,
  seen_uids text[]
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  connection public.property_calendar_connections;
  reservation public.reservations;
  turnover_id uuid;
  actor uuid;
  cancelled_count integer := 0;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  actor := coalesce(
    auth.uid(),
    connection.created_by,
    (
      select member.user_id
      from public.business_members member
      where member.account_id = connection.account_id
      order by case member.role when 'owner' then 0 when 'manager' then 1 else 2 end,
        member.created_at, member.user_id
      limit 1
    )
  );
  if actor is null then raise exception 'calendar_sync_actor_unavailable'; end if;
  for reservation in
    select * from public.reservations
    where source_connection_id = connection.id and status <> 'cancelled'
      and not (external_uid = any(seen_uids))
    for update
  loop
    if reservation.missing_sync_count + 1 < 2 then
      update public.reservations set missing_sync_count = missing_sync_count + 1
      where id = reservation.id;
    else
      update public.reservations set status = 'cancelled', source_status = 'missing',
        cancelled_at = clock_timestamp(), missing_sync_count = missing_sync_count + 1,
        updated_at = clock_timestamp()
      where id = reservation.id;
      select id into turnover_id from public.work_items where reservation_id = reservation.id;
      perform public.record_reservation_event(
        reservation.account_id, reservation.id, turnover_id, 'reservation.cancelled',
        jsonb_build_object('status', reservation.status), jsonb_build_object('status', 'cancelled'),
        jsonb_build_object('origin', 'calendar', 'reason', 'missing_twice'), actor
      );
      perform set_config('quickola.reservation_sync', 'on', true);
      perform public.sync_turnover_for_reservation(reservation.id, actor);
      cancelled_count := cancelled_count + 1;
    end if;
  end loop;
  if cancelled_count > 0 then
    perform public.refresh_reservation_turnovers_for_property(
      connection.account_id, connection.property_id, actor
    );
  end if;
  return cancelled_count;
end $$;
revoke all on function public.finalize_ical_missing_reservations(uuid,text[]) from public, anon;
grant execute on function public.finalize_ical_missing_reservations(uuid,text[])
  to authenticated, service_role;

create or replace function public.record_calendar_sync_issue(
  target_connection uuid,
  selected_issue_type text,
  uid_hash text,
  message text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare connection public.property_calendar_connections;
declare issue_id uuid;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  select id into issue_id from public.reservation_sync_issues
  where connection_id = connection.id and issue_type = selected_issue_type
    and external_uid_hash is not distinct from uid_hash and issue_status = 'open'
  limit 1 for update;
  if issue_id is null then
    insert into public.reservation_sync_issues(
      account_id, connection_id, property_id, external_uid_hash, issue_type, safe_message
    ) values (
      connection.account_id, connection.id, connection.property_id,
      uid_hash, selected_issue_type, left(message, 500)
    ) returning id into issue_id;
    insert into public.activity_events(
      account_id, property_id, actor_user_id, event_type, description, metadata
    ) values (
      connection.account_id, connection.property_id, auth.uid(),
      'calendar_attention_required', 'Reservation calendar needs attention',
      jsonb_build_object('issue_type', selected_issue_type, 'provider', connection.provider)
    );
  else
    update public.reservation_sync_issues
    set safe_message = left(message, 500), last_seen_at = clock_timestamp()
    where id = issue_id;
  end if;
  return issue_id;
end $$;
revoke all on function public.record_calendar_sync_issue(uuid,text,text,text) from public, anon;
grant execute on function public.record_calendar_sync_issue(uuid,text,text,text)
  to authenticated, service_role;

create or replace function public.resolve_calendar_sync_issue(
  target_connection uuid,
  selected_issue_type text,
  uid_hash text
) returns void language plpgsql security definer set search_path = '' as $$
declare connection public.property_calendar_connections;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  update public.reservation_sync_issues
  set issue_status = 'resolved', resolved_at = clock_timestamp(),
    last_seen_at = clock_timestamp()
  where connection_id = connection.id and issue_type = selected_issue_type
    and external_uid_hash is not distinct from uid_hash
    and issue_status = 'open';
end $$;
revoke all on function public.resolve_calendar_sync_issue(uuid,text,text) from public, anon;
grant execute on function public.resolve_calendar_sync_issue(uuid,text,text)
  to authenticated, service_role;

create or replace function public.complete_property_calendar_sync(
  target_connection uuid,
  was_successful boolean,
  next_status text,
  error_code text,
  safe_error_message text,
  feed_fingerprint text,
  result_summary jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare connection public.property_calendar_connections;
declare first_success boolean;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null for update;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  first_success := connection.last_successful_sync_at is null and was_successful;
  update public.property_calendar_connections set
    sync_status = next_status,
    last_successful_sync_at = case when was_successful then clock_timestamp() else last_successful_sync_at end,
    last_sync_completed_at = clock_timestamp(),
    last_error_code = case when was_successful then null else error_code end,
    last_error_message = case when was_successful then null else left(safe_error_message, 500) end,
    consecutive_failure_count = case when was_successful then 0 else consecutive_failure_count + 1 end,
    last_feed_fingerprint = case when was_successful then feed_fingerprint else last_feed_fingerprint end,
    last_sync_summary = coalesce(result_summary, '{}'::jsonb),
    updated_at = clock_timestamp()
  where id = connection.id;
  if first_success then
    insert into public.activity_events(
      account_id, property_id, actor_user_id, event_type, description, metadata
    ) values (
      connection.account_id, connection.property_id, auth.uid(),
      'calendar_initial_sync_completed', 'Initial reservation calendar sync completed',
      jsonb_build_object('provider', connection.provider)
    );
  end if;
end $$;
revoke all on function public.complete_property_calendar_sync(uuid,boolean,text,text,text,text,jsonb)
  from public, anon;
grant execute on function public.complete_property_calendar_sync(uuid,boolean,text,text,text,text,jsonb)
  to authenticated, service_role;

revoke select on public.reservations from authenticated;
grant select (
  id, account_id, property_id, source, guest_name, guest_count,
  check_in_at, check_out_at, status, source_updated_at, cancelled_at,
  created_at, updated_at, source_connection_id
) on public.reservations to authenticated;
