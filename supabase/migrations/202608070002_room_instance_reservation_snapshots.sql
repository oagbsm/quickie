-- Keep reservation-created turnovers on the same room-aware checklist
-- snapshot path as manually created turnovers.
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

    perform public.snapshot_work_item_checklist(item.id);
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
      perform public.snapshot_work_item_checklist(item.id);
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
