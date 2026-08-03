alter table public.reservation_sync_issues
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.record_calendar_sync_issue_with_metadata(
  target_connection uuid,
  selected_issue_type text,
  uid_hash text,
  message text,
  issue_metadata jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  issue_id uuid;
  acknowledged_issue_id uuid;
begin
  if selected_issue_type = 'overlap_conflict'
    and coalesce(issue_metadata->>'conflict_fingerprint', '') <> '' then
    select id into acknowledged_issue_id
    from public.reservation_sync_issues
    where connection_id = target_connection
      and issue_type = 'overlap_conflict'
      and issue_status = 'resolved'
      and metadata->>'operator_acknowledged' = 'true'
      and (
        metadata->>'acknowledged_fingerprint' = issue_metadata->>'conflict_fingerprint'
        or metadata->>'acknowledged_message' = left(message, 500)
      )
    order by resolved_at desc nulls last
    limit 1;
    if acknowledged_issue_id is not null then
      update public.reservation_sync_issues
      set last_seen_at = clock_timestamp()
      where id = acknowledged_issue_id;
      return acknowledged_issue_id;
    end if;
  end if;
  issue_id := public.record_calendar_sync_issue(
    target_connection, selected_issue_type, uid_hash, message
  );
  update public.reservation_sync_issues
  set metadata = coalesce(issue_metadata, '{}'::jsonb)
  where id = issue_id;
  return issue_id;
end $$;
revoke all on function public.record_calendar_sync_issue_with_metadata(uuid,text,text,text,jsonb) from public, anon;
grant execute on function public.record_calendar_sync_issue_with_metadata(uuid,text,text,text,jsonb)
  to authenticated, service_role;

create or replace function public.ignore_calendar_overlap_conflict(
  target_issue uuid
) returns void language plpgsql security definer set search_path = '' as $$
declare
  issue public.reservation_sync_issues;
begin
  select * into issue
  from public.reservation_sync_issues
  where id = target_issue
    and issue_type = 'overlap_conflict'
    and issue_status = 'open'
  for update;
  if issue.id is null or not public.calendar_connection_authorised(issue.account_id) then
    raise exception 'calendar_issue_not_found';
  end if;
  update public.reservation_sync_issues
  set issue_status = 'resolved',
      resolved_at = clock_timestamp(),
      last_seen_at = clock_timestamp(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'operator_acknowledged', true,
        'acknowledged_fingerprint', metadata->>'conflict_fingerprint',
        'acknowledged_message', issue.safe_message,
        'acknowledged_at', clock_timestamp()
      )
  where id = issue.id;
end $$;
revoke all on function public.ignore_calendar_overlap_conflict(uuid) from public, anon;
grant execute on function public.ignore_calendar_overlap_conflict(uuid)
  to authenticated, service_role;

create or replace function public.ignore_calendar_overlap_conflicts_for_property(
  target_property uuid
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  property_account uuid;
  acknowledged_count integer := 0;
begin
  select account_id into property_account
  from public.properties
  where id = target_property;
  if property_account is null or not public.is_business_member(property_account) then
    raise exception 'property_not_found';
  end if;

  update public.reservation_sync_issues
  set issue_status = 'resolved',
      resolved_at = clock_timestamp(),
      last_seen_at = clock_timestamp(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'operator_acknowledged', true,
        'acknowledged_fingerprint', metadata->>'conflict_fingerprint',
        'acknowledged_message', safe_message,
        'acknowledged_at', clock_timestamp()
      )
  where property_id = target_property
    and issue_type = 'overlap_conflict'
    and issue_status = 'open'
    and public.calendar_connection_authorised(account_id);
  get diagnostics acknowledged_count = row_count;
  return acknowledged_count;
end $$;
revoke all on function public.ignore_calendar_overlap_conflicts_for_property(uuid) from public, anon;
grant execute on function public.ignore_calendar_overlap_conflicts_for_property(uuid)
  to authenticated, service_role;

create or replace function public.resolve_stale_calendar_overlap_conflicts(
  target_connection uuid,
  seen_uid_hashes text[]
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  connection public.property_calendar_connections;
  resolved_count integer := 0;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;

  update public.reservation_sync_issues
  set issue_status = 'resolved', resolved_at = clock_timestamp(), last_seen_at = clock_timestamp()
  where connection_id = connection.id
    and issue_type = 'overlap_conflict'
    and issue_status = 'open'
    and external_uid_hash is not null
    and not (external_uid_hash = any(coalesce(seen_uid_hashes, array[]::text[])));
  get diagnostics resolved_count = row_count;
  return resolved_count;
end $$;
revoke all on function public.resolve_stale_calendar_overlap_conflicts(uuid,text[]) from public, anon;
grant execute on function public.resolve_stale_calendar_overlap_conflicts(uuid,text[])
  to authenticated, service_role;
