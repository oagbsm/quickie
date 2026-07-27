-- Sprint 1A: atomic manual reservations linked to the existing STR work item.
-- The customer-portal tenant is called an account throughout the established
-- schema, so reservations use account_id as the business ownership key.

create unique index if not exists properties_id_account_unique
  on public.properties(id, account_id);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  property_id uuid not null,
  source text not null default 'manual'
    check (source ~ '^[a-z][a-z0-9_]*$'),
  external_reservation_id text not null
    check (char_length(trim(external_reservation_id)) between 1 and 240),
  guest_name text check (
    guest_name is null or char_length(trim(guest_name)) between 1 and 160
  ),
  guest_count integer check (guest_count is null or guest_count > 0),
  check_in_at timestamptz not null,
  check_out_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed')),
  source_updated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservation_stay_order check (check_out_at > check_in_at),
  constraint reservation_cancellation_state check (
    (status = 'cancelled') = (cancelled_at is not null)
  ),
  constraint reservation_property_tenant_fk
    foreign key(property_id, account_id)
    references public.properties(id, account_id) on delete restrict
);

create unique index if not exists reservations_source_reference_unique
  on public.reservations(account_id, source, external_reservation_id);
create unique index if not exists reservations_id_account_unique
  on public.reservations(id, account_id);
create unique index if not exists reservations_id_property_account_unique
  on public.reservations(id, property_id, account_id);
create index if not exists reservations_account_idx
  on public.reservations(account_id);
create index if not exists reservations_property_idx
  on public.reservations(property_id);
create index if not exists reservations_status_idx
  on public.reservations(status);
create index if not exists reservations_check_in_idx
  on public.reservations(check_in_at);
create index if not exists reservations_check_out_idx
  on public.reservations(check_out_at);
create index if not exists reservations_property_next_idx
  on public.reservations(account_id, property_id, check_in_at)
  where status = 'confirmed';

alter table public.work_items
  drop constraint if exists turnover_schedule_order;
alter table public.work_items
  alter column next_checkin_at drop not null,
  add column if not exists reservation_id uuid,
  add column if not exists window_end_at timestamptz,
  add column if not exists creation_source text not null default 'manual',
  add column if not exists requires_attention boolean not null default false,
  add column if not exists cancelled_at timestamptz;

update public.work_items
set window_end_at = next_checkin_at
where window_end_at is null;
update public.work_items
set cancelled_at = coalesce(updated_at, created_at)
where status = 'cancelled' and cancelled_at is null;

alter table public.work_items
  alter column window_end_at set not null,
  drop constraint if exists work_items_creation_source_check,
  add constraint work_items_creation_source_check
    check (creation_source ~ '^[a-z][a-z0-9_]*$'),
  drop constraint if exists work_items_window_order,
  add constraint work_items_window_order
    check (guest_checkout_at <= access_start_at and access_start_at < window_end_at),
  drop constraint if exists work_items_cancellation_timestamp,
  add constraint work_items_cancellation_timestamp
    check (status <> 'cancelled' or cancelled_at is not null);

create unique index if not exists work_items_id_account_unique
  on public.work_items(id, account_id);
create unique index if not exists work_items_one_per_reservation_idx
  on public.work_items(reservation_id)
  where reservation_id is not null;
create index if not exists work_items_reservation_idx
  on public.work_items(account_id, reservation_id)
  where reservation_id is not null;

alter table public.work_items
  drop constraint if exists work_items_reservation_tenant_fk,
  add constraint work_items_reservation_tenant_fk
    foreign key(reservation_id, property_id, account_id)
    references public.reservations(id, property_id, account_id) on delete restrict
    deferrable initially deferred;

create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  reservation_id uuid not null,
  turnover_id uuid references public.work_items(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  constraint reservation_events_reservation_tenant_fk
    foreign key(reservation_id, account_id)
    references public.reservations(id, account_id) on delete restrict
);
create index if not exists reservation_events_reservation_time_idx
  on public.reservation_events(reservation_id, sequence);
create index if not exists reservation_events_account_time_idx
  on public.reservation_events(account_id, created_at desc);

alter table public.reservations enable row level security;
alter table public.reservation_events enable row level security;

drop policy if exists "members view reservations" on public.reservations;
create policy "members view reservations" on public.reservations
  for select to authenticated
  using (public.is_business_member(account_id));

drop policy if exists "members view reservation events" on public.reservation_events;
create policy "members view reservation events" on public.reservation_events
  for select to authenticated
  using (public.is_business_member(account_id));

-- Linked turnover schedule fields can only be changed by the reservation
-- transaction. Existing operational status/assignment workflows remain valid.
create or replace function public.guard_reservation_linked_turnover()
returns trigger language plpgsql set search_path = '' as $$
declare reservation_sync boolean := coalesce(
  current_setting('quickola.reservation_sync', true), ''
) = 'on';
privileged boolean := current_user in ('postgres', 'service_role', 'supabase_admin');
begin
  if tg_op = 'INSERT' then
    new.window_end_at := coalesce(new.window_end_at, new.next_checkin_at);
    if new.status = 'cancelled' then
      new.cancelled_at := coalesce(new.cancelled_at, clock_timestamp());
    end if;
  end if;

  if tg_op = 'DELETE' and old.reservation_id is not null
    and not reservation_sync and not privileged then
    raise exception 'linked_turnover_cannot_be_deleted';
  end if;

  if tg_op = 'INSERT' and new.reservation_id is not null
    and not reservation_sync and not privileged then
    raise exception 'linked_turnover_requires_reservation_processor';
  end if;

  if tg_op = 'UPDATE' and old.reservation_id is not null
    and not reservation_sync and not privileged then
    if new.reservation_id is distinct from old.reservation_id
      or new.account_id is distinct from old.account_id
      or new.property_id is distinct from old.property_id
      or new.turnover_date is distinct from old.turnover_date
      or new.guest_checkout_at is distinct from old.guest_checkout_at
      or new.access_start_at is distinct from old.access_start_at
      or new.window_end_at is distinct from old.window_end_at
      or new.next_checkin_at is distinct from old.next_checkin_at
      or new.creation_source is distinct from old.creation_source
      or new.requires_attention is distinct from old.requires_attention
      or new.cancelled_at is distinct from old.cancelled_at
      or (new.status = 'cancelled' and old.status <> 'cancelled') then
      raise exception 'linked_turnover_requires_reservation_processor';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.reservation_id is null
    and new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, clock_timestamp());
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists guard_reservation_linked_turnover on public.work_items;
create trigger guard_reservation_linked_turnover
before insert or update or delete on public.work_items
for each row execute function public.guard_reservation_linked_turnover();

create or replace function public.record_reservation_event(
  target_account uuid,
  target_reservation uuid,
  target_turnover uuid,
  target_event_type text,
  target_previous jsonb default '{}'::jsonb,
  target_new jsonb default '{}'::jsonb,
  target_metadata jsonb default '{}'::jsonb,
  target_actor uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare event_id uuid;
begin
  insert into public.reservation_events(
    account_id, reservation_id, turnover_id, event_type,
    previous_values, new_values, metadata, actor_user_id, created_at
  ) values (
    target_account, target_reservation, target_turnover, target_event_type,
    coalesce(target_previous, '{}'::jsonb), coalesce(target_new, '{}'::jsonb),
    coalesce(target_metadata, '{}'::jsonb), target_actor, clock_timestamp()
  ) returning id into event_id;
  return event_id;
end $$;
revoke all on function public.record_reservation_event(uuid,uuid,uuid,text,jsonb,jsonb,jsonb,uuid)
  from public, anon, authenticated;

create or replace function public.sync_turnover_for_reservation(
  target_reservation uuid,
  target_actor uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  reservation public.reservations;
  property public.properties;
  item public.work_items;
  next_arrival timestamptz;
  standard_deadline timestamptz;
  deadline timestamptz;
  cleaning_day date;
  attention boolean;
  turnover_cancelled_at timestamptz;
  old_values jsonb := '{}'::jsonb;
  new_values jsonb := '{}'::jsonb;
  selected_template_id uuid;
begin
  select * into reservation
  from public.reservations
  where id = target_reservation
  for update;
  if reservation.id is null then raise exception 'reservation_not_found'; end if;

  select * into property
  from public.properties
  where id = reservation.property_id and account_id = reservation.account_id;
  if property.id is null then raise exception 'property_not_found'; end if;

  select * into item
  from public.work_items
  where reservation_id = reservation.id
  for update;

  if reservation.status = 'cancelled' then
    if item.id is null then raise exception 'linked_turnover_not_found'; end if;
    if item.status <> 'cancelled' then
      turnover_cancelled_at := clock_timestamp();
      update public.assignments
      set status = 'cancelled', cancelled_at = coalesce(cancelled_at, turnover_cancelled_at)
      where work_item_id = item.id and status in ('pending', 'accepted');

      update public.work_items
      set status = 'cancelled', cancelled_at = turnover_cancelled_at,
        updated_at = turnover_cancelled_at
      where id = item.id;
      perform public.record_reservation_event(
        reservation.account_id, reservation.id, item.id, 'turnover.cancelled',
        jsonb_build_object('status', item.status, 'cancelled_at', item.cancelled_at),
        jsonb_build_object('status', 'cancelled', 'cancelled_at', turnover_cancelled_at),
        '{}'::jsonb, target_actor
      );
    end if;
    return item.id;
  end if;

  select r.check_in_at into next_arrival
  from public.reservations r
  where r.account_id = reservation.account_id
    and r.property_id = reservation.property_id
    and r.id <> reservation.id
    and r.status = 'confirmed'
    and r.check_in_at >= reservation.check_out_at
  order by r.check_in_at, r.id
  limit 1;

  cleaning_day := (reservation.check_out_at at time zone 'Europe/London')::date;
  standard_deadline := (
    cleaning_day + property.default_checkin_time
  ) at time zone 'Europe/London';
  if standard_deadline <= reservation.check_out_at then
    standard_deadline := reservation.check_out_at
      + make_interval(mins => property.estimated_turnover_minutes);
  end if;
  deadline := coalesce(next_arrival, standard_deadline);
  if deadline <= reservation.check_out_at then
    raise exception 'invalid_turnover_window';
  end if;
  attention := deadline - reservation.check_out_at
    < make_interval(mins => property.estimated_turnover_minutes);

  if item.id is null then
    insert into public.work_items(
      account_id, property_id, reservation_id, property_public_name,
      property_general_area, service_code, status, cleaning_type,
      turnover_date, guest_checkout_at, access_start_at, window_end_at,
      next_checkin_at, estimated_duration_minutes, linen_requirement,
      required_evidence_count, risk_acknowledged, creation_source,
      requires_attention, created_by
    ) values (
      reservation.account_id, reservation.property_id, reservation.id,
      property.nickname, split_part(trim(property.postcode), ' ', 1),
      'str_turnover', 'unassigned', 'standard_turnover', cleaning_day,
      reservation.check_out_at, reservation.check_out_at, deadline,
      next_arrival, property.estimated_turnover_minutes,
      property.linen_requirements, property.required_completion_photos,
      attention, 'manual_reservation', attention, target_actor
    ) returning * into item;

    select t.id into selected_template_id
    from public.checklist_templates t
    where t.property_id = reservation.property_id and t.active
    order by t.version desc, t.created_at desc
    limit 1;
    if selected_template_id is not null then
      insert into public.checklist_tasks(
        account_id, work_item_id, source_task_id, section_title, label,
        description, position, response_type, mandatory, photo_required,
        note_required, blocking
      )
      select reservation.account_id, item.id, task.id, section.title,
        task.label, task.description, section.position * 100 + task.position,
        task.response_type, task.mandatory, task.photo_required,
        task.note_required, task.blocking
      from public.checklist_template_sections section
      join public.checklist_template_tasks task on task.section_id = section.id
      where section.template_id = selected_template_id;
    end if;

    perform public.record_reservation_event(
      reservation.account_id, reservation.id, item.id, 'turnover.created',
      '{}'::jsonb,
      jsonb_build_object(
        'property_id', item.property_id,
        'turnover_date', item.turnover_date,
        'window_start_at', item.access_start_at,
        'window_end_at', item.window_end_at,
        'next_check_in_at', item.next_checkin_at,
        'status', item.status,
        'requires_attention', item.requires_attention
      ),
      jsonb_build_object('creation_source', 'manual_reservation'),
      target_actor
    );
    return item.id;
  end if;

  if item.status = 'cancelled' then raise exception 'linked_turnover_cancelled'; end if;
  if item.property_id is distinct from reservation.property_id
    and item.status not in ('draft', 'unassigned', 'declined') then
    raise exception 'linked_turnover_property_change_locked';
  end if;

  if item.property_id is distinct from reservation.property_id then
    old_values := old_values || jsonb_build_object('property_id', item.property_id);
    new_values := new_values || jsonb_build_object('property_id', reservation.property_id);
  end if;
  if item.turnover_date is distinct from cleaning_day then
    old_values := old_values || jsonb_build_object('turnover_date', item.turnover_date);
    new_values := new_values || jsonb_build_object('turnover_date', cleaning_day);
  end if;
  if item.guest_checkout_at is distinct from reservation.check_out_at then
    old_values := old_values || jsonb_build_object('guest_checkout_at', item.guest_checkout_at);
    new_values := new_values || jsonb_build_object('guest_checkout_at', reservation.check_out_at);
  end if;
  if item.access_start_at is distinct from reservation.check_out_at then
    old_values := old_values || jsonb_build_object('window_start_at', item.access_start_at);
    new_values := new_values || jsonb_build_object('window_start_at', reservation.check_out_at);
  end if;
  if item.window_end_at is distinct from deadline then
    old_values := old_values || jsonb_build_object('window_end_at', item.window_end_at);
    new_values := new_values || jsonb_build_object('window_end_at', deadline);
  end if;
  if item.next_checkin_at is distinct from next_arrival then
    old_values := old_values || jsonb_build_object('next_check_in_at', item.next_checkin_at);
    new_values := new_values || jsonb_build_object('next_check_in_at', next_arrival);
  end if;
  if item.requires_attention is distinct from attention then
    old_values := old_values || jsonb_build_object('requires_attention', item.requires_attention);
    new_values := new_values || jsonb_build_object('requires_attention', attention);
  end if;

  if new_values <> '{}'::jsonb then
    update public.work_items
    set property_id = reservation.property_id,
      property_public_name = property.nickname,
      property_general_area = split_part(trim(property.postcode), ' ', 1),
      turnover_date = cleaning_day,
      guest_checkout_at = reservation.check_out_at,
      access_start_at = reservation.check_out_at,
      window_end_at = deadline,
      next_checkin_at = next_arrival,
      estimated_duration_minutes = property.estimated_turnover_minutes,
      linen_requirement = property.linen_requirements,
      required_evidence_count = property.required_completion_photos,
      risk_acknowledged = attention,
      requires_attention = attention,
      updated_at = clock_timestamp()
    where id = item.id;
    if item.property_id is distinct from reservation.property_id then
      delete from public.checklist_tasks where work_item_id = item.id;
      select t.id into selected_template_id
      from public.checklist_templates t
      where t.property_id = reservation.property_id and t.active
      order by t.version desc, t.created_at desc
      limit 1;
      if selected_template_id is not null then
        insert into public.checklist_tasks(
          account_id, work_item_id, source_task_id, section_title, label,
          description, position, response_type, mandatory, photo_required,
          note_required, blocking
        )
        select reservation.account_id, item.id, task.id, section.title,
          task.label, task.description, section.position * 100 + task.position,
          task.response_type, task.mandatory, task.photo_required,
          task.note_required, task.blocking
        from public.checklist_template_sections section
        join public.checklist_template_tasks task on task.section_id = section.id
        where section.template_id = selected_template_id;
      end if;
    end if;
    perform public.record_reservation_event(
      reservation.account_id, reservation.id, item.id, 'turnover.updated',
      old_values, new_values,
      jsonb_build_object('reason', 'reservation_sync'), target_actor
    );
  end if;
  return item.id;
end $$;
revoke all on function public.sync_turnover_for_reservation(uuid,uuid)
  from public, anon, authenticated;

create or replace function public.refresh_reservation_turnovers_for_property(
  target_account uuid,
  target_property uuid,
  target_actor uuid
) returns void language plpgsql security definer set search_path = '' as $$
declare row record;
begin
  for row in
    select id from public.reservations
    where account_id = target_account
      and property_id = target_property
      and status = 'confirmed'
    order by check_out_at, id
  loop
    perform public.sync_turnover_for_reservation(row.id, target_actor);
  end loop;
end $$;
revoke all on function public.refresh_reservation_turnovers_for_property(uuid,uuid,uuid)
  from public, anon, authenticated;

create or replace function public.create_manual_reservation(
  request_key text,
  payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  account uuid;
  property_id uuid;
  property public.properties;
  existing public.reservations;
  created public.reservations;
  check_in timestamptz;
  check_out timestamptz;
  guest_count integer;
  guest_name text;
  external_reference text;
  turnover_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select account_id into account
  from public.business_members where user_id = actor limit 1;
  if account is null then raise exception 'forbidden'; end if;
  if request_key is null or request_key !~ '^[A-Za-z0-9_-]{8,128}$' then
    raise exception 'invalid_request_key';
  end if;

  begin
    property_id := (payload->>'property_id')::uuid;
    check_in := (payload->>'check_in_at')::timestamptz;
    check_out := (payload->>'check_out_at')::timestamptz;
    guest_count := nullif(payload->>'guest_count', '')::integer;
  exception when others then
    raise exception 'invalid_reservation_input';
  end;
  guest_name := nullif(trim(payload->>'guest_name'), '');
  if check_in is null or check_out is null or check_out <= check_in then
    raise exception 'invalid_date_range';
  end if;
  if guest_count is not null and guest_count <= 0 then
    raise exception 'invalid_guest_count';
  end if;
  if guest_name is not null and char_length(guest_name) > 160 then
    raise exception 'invalid_guest_name';
  end if;

  select * into property from public.properties
  where id = property_id and account_id = account and status = 'active';
  if property.id is null then raise exception 'property_not_found'; end if;

  external_reference := 'manual:' || request_key;
  perform pg_advisory_xact_lock(hashtextextended(account::text || ':' || external_reference, 0));
  select * into existing from public.reservations
  where account_id = account and source = 'manual'
    and external_reservation_id = external_reference
  for update;
  if existing.id is not null then
    if existing.property_id is distinct from property_id
      or existing.guest_name is distinct from guest_name
      or existing.guest_count is distinct from guest_count
      or existing.check_in_at is distinct from check_in
      or existing.check_out_at is distinct from check_out then
      raise exception 'idempotency_conflict';
    end if;
    perform set_config('quickola.reservation_sync', 'on', true);
    turnover_id := public.sync_turnover_for_reservation(existing.id, actor);
    return jsonb_build_object(
      'reservation_id', existing.id, 'turnover_id', turnover_id,
      'created', false, 'changed', false
    );
  end if;

  insert into public.reservations(
    account_id, property_id, source, external_reservation_id,
    guest_name, guest_count, check_in_at, check_out_at, status
  ) values (
    account, property_id, 'manual', external_reference,
    guest_name, guest_count, check_in, check_out, 'confirmed'
  ) returning * into created;

  perform public.record_reservation_event(
    account, created.id, null, 'reservation.created', '{}'::jsonb,
    jsonb_build_object(
      'property_id', created.property_id,
      'source', created.source,
      'guest_name', created.guest_name,
      'guest_count', created.guest_count,
      'check_in_at', created.check_in_at,
      'check_out_at', created.check_out_at,
      'status', created.status
    ),
    jsonb_build_object('property_name', property.nickname), actor
  );
  perform set_config('quickola.reservation_sync', 'on', true);
  turnover_id := public.sync_turnover_for_reservation(created.id, actor);
  perform public.refresh_reservation_turnovers_for_property(account, property_id, actor);
  return jsonb_build_object(
    'reservation_id', created.id, 'turnover_id', turnover_id,
    'created', true, 'changed', true
  );
end $$;
revoke all on function public.create_manual_reservation(text,jsonb)
  from public, anon, authenticated;
grant execute on function public.create_manual_reservation(text,jsonb) to authenticated;

create or replace function public.update_manual_reservation(
  target_reservation uuid,
  payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  account uuid;
  current_reservation public.reservations;
  updated_reservation public.reservations;
  old_property public.properties;
  new_property public.properties;
  submitted_property_id uuid;
  check_in timestamptz;
  check_out timestamptz;
  submitted_guest_count integer;
  submitted_guest_name text;
  previous_values jsonb := '{}'::jsonb;
  new_values jsonb := '{}'::jsonb;
  metadata jsonb := '{}'::jsonb;
  schedule_changed boolean := false;
  turnover_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select account_id into account
  from public.business_members where user_id = actor limit 1;
  if account is null then raise exception 'forbidden'; end if;

  select * into current_reservation from public.reservations
  where id = target_reservation and account_id = account
  for update;
  if current_reservation.id is null then raise exception 'reservation_not_found'; end if;
  if current_reservation.source <> 'manual' then raise exception 'reservation_not_manual'; end if;
  if current_reservation.status = 'cancelled' then raise exception 'reservation_cancelled'; end if;

  begin
    submitted_property_id := (payload->>'property_id')::uuid;
    check_in := (payload->>'check_in_at')::timestamptz;
    check_out := (payload->>'check_out_at')::timestamptz;
    submitted_guest_count := nullif(payload->>'guest_count', '')::integer;
  exception when others then
    raise exception 'invalid_reservation_input';
  end;
  submitted_guest_name := nullif(trim(payload->>'guest_name'), '');
  if check_in is null or check_out is null or check_out <= check_in then
    raise exception 'invalid_date_range';
  end if;
  if submitted_guest_count is not null and submitted_guest_count <= 0 then
    raise exception 'invalid_guest_count';
  end if;
  if submitted_guest_name is not null and char_length(submitted_guest_name) > 160 then
    raise exception 'invalid_guest_name';
  end if;

  select * into new_property from public.properties
  where id = submitted_property_id and account_id = account and status = 'active';
  if new_property.id is null then raise exception 'property_not_found'; end if;
  select * into old_property from public.properties
  where id = current_reservation.property_id and account_id = account;

  if current_reservation.property_id is distinct from submitted_property_id then
    previous_values := previous_values || jsonb_build_object('property_id', current_reservation.property_id);
    new_values := new_values || jsonb_build_object('property_id', submitted_property_id);
    metadata := metadata || jsonb_build_object(
      'previous_property_name', old_property.nickname,
      'new_property_name', new_property.nickname
    );
    schedule_changed := true;
  end if;
  if current_reservation.guest_name is distinct from submitted_guest_name then
    previous_values := previous_values || jsonb_build_object('guest_name', current_reservation.guest_name);
    new_values := new_values || jsonb_build_object('guest_name', submitted_guest_name);
  end if;
  if current_reservation.guest_count is distinct from submitted_guest_count then
    previous_values := previous_values || jsonb_build_object('guest_count', current_reservation.guest_count);
    new_values := new_values || jsonb_build_object('guest_count', submitted_guest_count);
  end if;
  if current_reservation.check_in_at is distinct from check_in then
    previous_values := previous_values || jsonb_build_object('check_in_at', current_reservation.check_in_at);
    new_values := new_values || jsonb_build_object('check_in_at', check_in);
    schedule_changed := true;
  end if;
  if current_reservation.check_out_at is distinct from check_out then
    previous_values := previous_values || jsonb_build_object('check_out_at', current_reservation.check_out_at);
    new_values := new_values || jsonb_build_object('check_out_at', check_out);
    schedule_changed := true;
  end if;

  if new_values = '{}'::jsonb then
    select id into turnover_id from public.work_items
    where reservation_id = current_reservation.id;
    return jsonb_build_object(
      'reservation_id', current_reservation.id, 'turnover_id', turnover_id,
      'created', false, 'changed', false
    );
  end if;

  update public.reservations
  set property_id = submitted_property_id,
    guest_name = submitted_guest_name,
    guest_count = submitted_guest_count,
    check_in_at = check_in,
    check_out_at = check_out,
    updated_at = clock_timestamp()
  where id = current_reservation.id
  returning * into updated_reservation;

  select id into turnover_id from public.work_items
  where reservation_id = current_reservation.id;
  perform public.record_reservation_event(
    account, current_reservation.id, turnover_id, 'reservation.updated',
    previous_values, new_values, metadata, actor
  );

  if schedule_changed then
    perform set_config('quickola.reservation_sync', 'on', true);
    perform public.refresh_reservation_turnovers_for_property(
      account, current_reservation.property_id, actor
    );
    if submitted_property_id <> current_reservation.property_id then
      perform public.refresh_reservation_turnovers_for_property(account, submitted_property_id, actor);
    end if;
  end if;
  select id into turnover_id from public.work_items
  where reservation_id = current_reservation.id;
  return jsonb_build_object(
    'reservation_id', updated_reservation.id, 'turnover_id', turnover_id,
    'created', false, 'changed', true
  );
end $$;
revoke all on function public.update_manual_reservation(uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.update_manual_reservation(uuid,jsonb) to authenticated;

create or replace function public.cancel_manual_reservation(
  target_reservation uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  account uuid;
  reservation public.reservations;
  cancellation_time timestamptz;
  turnover_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select account_id into account
  from public.business_members where user_id = actor limit 1;
  if account is null then raise exception 'forbidden'; end if;

  select * into reservation from public.reservations
  where id = target_reservation and account_id = account
  for update;
  if reservation.id is null then raise exception 'reservation_not_found'; end if;
  if reservation.source <> 'manual' then raise exception 'reservation_not_manual'; end if;
  select id into turnover_id from public.work_items
  where reservation_id = reservation.id;
  if reservation.status = 'cancelled' then
    return jsonb_build_object(
      'reservation_id', reservation.id, 'turnover_id', turnover_id,
      'created', false, 'changed', false
    );
  end if;

  cancellation_time := clock_timestamp();
  update public.reservations
  set status = 'cancelled', cancelled_at = cancellation_time,
    updated_at = cancellation_time
  where id = reservation.id;
  perform public.record_reservation_event(
    account, reservation.id, turnover_id, 'reservation.cancelled',
    jsonb_build_object('status', reservation.status, 'cancelled_at', reservation.cancelled_at),
    jsonb_build_object('status', 'cancelled', 'cancelled_at', cancellation_time),
    '{}'::jsonb, actor
  );
  perform set_config('quickola.reservation_sync', 'on', true);
  turnover_id := public.sync_turnover_for_reservation(reservation.id, actor);
  perform public.refresh_reservation_turnovers_for_property(
    account, reservation.property_id, actor
  );
  return jsonb_build_object(
    'reservation_id', reservation.id, 'turnover_id', turnover_id,
    'created', false, 'changed', true
  );
end $$;
revoke all on function public.cancel_manual_reservation(uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_manual_reservation(uuid) to authenticated;

create or replace function public.server_sync_turnover_for_reservation(
  target_reservation uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  account uuid;
  reservation_account uuid;
  turnover_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select account_id into account
  from public.business_members where user_id = actor limit 1;
  select account_id into reservation_account
  from public.reservations where id = target_reservation;
  if account is null or reservation_account is distinct from account then
    raise exception 'reservation_not_found';
  end if;
  perform set_config('quickola.reservation_sync', 'on', true);
  turnover_id := public.sync_turnover_for_reservation(target_reservation, actor);
  return jsonb_build_object(
    'reservation_id', target_reservation, 'turnover_id', turnover_id,
    'created', false, 'changed', false
  );
end $$;
revoke all on function public.server_sync_turnover_for_reservation(uuid)
  from public, anon, authenticated;
grant execute on function public.server_sync_turnover_for_reservation(uuid) to authenticated;
