-- Sprint 4: automatic calendar sync scheduling and failure backoff.

alter table public.property_calendar_connections
  add column if not exists next_sync_at timestamptz;

create index if not exists property_calendar_connections_next_sync_idx
  on public.property_calendar_connections(next_sync_at)
  where removed_at is null and is_active;

create or replace view public.property_calendar_connections_safe
with (security_barrier = true) as
select
  id, account_id, property_id, provider, display_name, masked_calendar_url,
  is_active, sync_status, last_sync_started_at, last_successful_sync_at,
  last_sync_completed_at, last_error_code, last_error_message,
  consecutive_failure_count, last_sync_summary, created_at, updated_at,
  next_sync_at
from public.property_calendar_connections
where removed_at is null and public.is_business_member(account_id);
revoke all on public.property_calendar_connections_safe from public, anon;
grant select on public.property_calendar_connections_safe to authenticated;

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
declare failure_count integer;
begin
  select * into connection from public.property_calendar_connections
  where id = target_connection and removed_at is null for update;
  if connection.id is null or not public.calendar_connection_authorised(connection.account_id) then
    raise exception 'calendar_connection_not_found';
  end if;
  first_success := connection.last_successful_sync_at is null and was_successful;
  failure_count := case when was_successful then 0 else connection.consecutive_failure_count + 1 end;
  update public.property_calendar_connections set
    sync_status = next_status,
    last_successful_sync_at = case when was_successful then clock_timestamp() else last_successful_sync_at end,
    last_sync_completed_at = clock_timestamp(),
    next_sync_at = clock_timestamp() + case
      when was_successful then interval '15 minutes'
      when failure_count <= 1 then interval '15 minutes'
      when failure_count = 2 then interval '30 minutes'
      when failure_count = 3 then interval '1 hour'
      when failure_count = 4 then interval '2 hours'
      else interval '6 hours'
    end,
    last_error_code = case when was_successful then null else error_code end,
    last_error_message = case when was_successful then null else left(safe_error_message, 500) end,
    consecutive_failure_count = failure_count,
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
