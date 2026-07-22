-- Controlled Slough pilot: coherent lifecycle, conflict protection and auditable operations.

alter table public.business_bookings drop constraint if exists business_bookings_status_check;
update public.business_bookings set status='provider_assigned' where status='assigned';
alter table public.business_bookings add constraint business_bookings_status_check check (status in (
  'requested','under_review','awaiting_customer_confirmation','confirmed','provider_assigned',
  'on_the_way','arrived','in_progress','completed','cancelled','unable_to_fulfil'
));
alter table public.business_bookings
  add column if not exists estimated_arrival_start timestamptz,
  add column if not exists estimated_arrival_end timestamptz,
  add column if not exists customer_update text,
  add column if not exists cancel_reason text,
  add column if not exists unable_to_fulfil_reason text,
  add column if not exists completed_by uuid references auth.users(id) on delete set null;
alter table public.business_bookings add constraint arrival_window_order check (
  estimated_arrival_end is null or estimated_arrival_start is null or estimated_arrival_end >= estimated_arrival_start
);
alter table public.service_providers add column if not exists internal_notes text;
alter table public.business_enquiries add column if not exists source_ip_hash text;

-- The same account cannot save the same normalised active address twice.
create unique index if not exists properties_account_normalised_address_idx
on public.properties(account_id, lower(regexp_replace(trim(address_line_1),'\s+',' ','g')), upper(regexp_replace(postcode,'\s+','','g')))
where status='active';

create or replace function public.server_create_business_booking(payload jsonb)
returns public.business_bookings language plpgsql security invoker set search_path='' as $$
declare result public.business_bookings; request_key uuid; start_at timestamptz; duration_mins integer; property_account uuid; property_state text;
begin
  request_key := (payload->>'idempotency_key')::uuid;
  select * into result from public.business_bookings
    where account_id=(payload->>'account_id')::uuid and idempotency_key=request_key;
  if result.id is not null then return result; end if;
  start_at := (payload->>'scheduled_start')::timestamptz;
  duration_mins := (payload->>'duration_minutes')::integer;
  select account_id,service_area_status into property_account,property_state from public.properties
    where id=(payload->>'property_id')::uuid and status='active';
  if property_account is distinct from (payload->>'account_id')::uuid then raise exception 'property_unavailable'; end if;
  if property_state <> 'eligible' then raise exception 'property_outside_service_area'; end if;
  perform pg_advisory_xact_lock(hashtextextended(payload->>'property_id',0));
  if exists(select 1 from public.business_bookings b where b.property_id=(payload->>'property_id')::uuid
    and b.status not in ('completed','cancelled','unable_to_fulfil')
    and b.scheduled_start < start_at + duration_mins * interval '1 minute'
    and b.scheduled_start + coalesce(b.duration_minutes,60) * interval '1 minute' > start_at)
  then raise exception 'booking_time_conflict'; end if;
  insert into public.business_bookings(account_id,property_id,service,scheduled_start,requirements,recurrence,extras,status,
    pricing_version,pricing_mode,pricing_breakdown,estimated_price_pence,estimated_price_max_pence,duration_minutes,
    requires_manual_review,customer_price_accepted,customer_price_accepted_at,idempotency_key)
  values((payload->>'account_id')::uuid,(payload->>'property_id')::uuid,payload->>'service',start_at,nullif(payload->>'requirements',''),
    payload->>'recurrence',coalesce(payload->'extras','[]'::jsonb),payload->>'status',payload->>'pricing_version',payload->>'pricing_mode',
    payload->'pricing_breakdown',(payload->>'estimated_price_pence')::integer,nullif(payload->>'estimated_price_max_pence','')::integer,
    duration_mins,(payload->>'requires_manual_review')::boolean,(payload->>'customer_price_accepted')::boolean,
    nullif(payload->>'customer_price_accepted_at','')::timestamptz,request_key) returning * into result;
  insert into public.booking_events(account_id,booking_id,event_type,actor_user_id,metadata)
    values(result.account_id,result.id,'booking_requested',nullif(payload->>'actor_user_id','')::uuid,jsonb_build_object('status',result.status));
  return result;
exception when unique_violation then
  select * into result from public.business_bookings where account_id=(payload->>'account_id')::uuid and idempotency_key=request_key;
  if result.id is not null then return result; end if; raise;
end $$;

create or replace function public.admin_transition_booking(target_booking uuid,next_status text,reason text default null,completion_note text default null)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings; valid boolean;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 select * into current_row from public.business_bookings where id=target_booking for update;
 if current_row.id is null then raise exception 'booking_not_found'; end if;
 if current_row.status=next_status then return current_row; end if;
 valid := (current_row.status='requested' and next_status in ('under_review','confirmed','cancelled','unable_to_fulfil'))
  or (current_row.status='under_review' and next_status in ('confirmed','cancelled','unable_to_fulfil'))
  or (current_row.status='awaiting_customer_confirmation' and next_status in ('cancelled','unable_to_fulfil'))
  or (current_row.status='confirmed' and next_status in ('cancelled','unable_to_fulfil'))
  or (current_row.status='provider_assigned' and next_status in ('on_the_way','confirmed','cancelled','unable_to_fulfil'))
  or (current_row.status='on_the_way' and next_status in ('arrived','cancelled','unable_to_fulfil'))
  or (current_row.status='arrived' and next_status in ('in_progress','cancelled','unable_to_fulfil'))
  or (current_row.status='in_progress' and next_status in ('completed','cancelled'));
 if not valid then raise exception 'invalid_status_transition:%->%',current_row.status,next_status; end if;
 if next_status in ('cancelled','unable_to_fulfil') and length(trim(coalesce(reason,'')))<5 then raise exception 'reason_required'; end if;
 update public.business_bookings set status=next_status,
  cancel_reason=case when next_status='cancelled' then trim(reason) else cancel_reason end,
  unable_to_fulfil_reason=case when next_status='unable_to_fulfil' then trim(reason) else unable_to_fulfil_reason end,
  completion_notes=case when next_status='completed' then nullif(trim(completion_note),'') else completion_notes end,
  completed_at=case when next_status='completed' then now() else completed_at end,
  completed_by=case when next_status='completed' then auth.uid() else completed_by end,updated_at=now()
 where id=target_booking returning * into updated_row;
 insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
 values(auth.uid(),'booking_status_changed','business_booking',target_booking,jsonb_build_object('status',current_row.status),
  jsonb_build_object('status',next_status,'reason',reason,'completion_notes',completion_note));
 insert into public.booking_events(account_id,booking_id,event_type,actor_user_id,metadata)
 values(updated_row.account_id,target_booking,'booking_'||next_status,auth.uid(),jsonb_build_object('previous_status',current_row.status));
 return updated_row;
end $$;

create or replace function public.admin_assign_provider(target_booking uuid,target_provider uuid)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings; outward text;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 select * into current_row from public.business_bookings where id=target_booking for update;
 if current_row.id is null then raise exception 'booking_not_found'; end if;
 select (regexp_match(upper(p.postcode),'^[A-Z]+[0-9]+'))[1] into outward from public.properties p where p.id=current_row.property_id;
 if current_row.status not in ('confirmed','provider_assigned') then raise exception 'booking_must_be_confirmed'; end if;
 if not exists(select 1 from public.service_providers p where p.id=target_provider and p.status='active' and outward=any(p.service_area))
 then raise exception 'provider_inactive_or_outside_service_area'; end if;
 if current_row.assigned_provider_id=target_provider and current_row.status='provider_assigned' then return current_row; end if;
 update public.business_bookings set assigned_provider_id=target_provider,status='provider_assigned',assigned_at=now(),
  provider_acceptance='pending',provider_notification_status='not_sent',updated_at=now() where id=target_booking returning * into updated_row;
 insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
 values(auth.uid(),case when current_row.assigned_provider_id is null then 'provider_assigned' else 'provider_changed' end,'business_booking',target_booking,
  jsonb_build_object('provider_id',current_row.assigned_provider_id),jsonb_build_object('provider_id',target_provider,'status','provider_assigned'));
 return updated_row;
end $$;

create or replace function public.admin_unassign_provider(target_booking uuid) returns public.business_bookings
language plpgsql security definer set search_path='' as $$
declare old public.business_bookings; result public.business_bookings;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 select * into old from public.business_bookings where id=target_booking for update;
 if old.status<>'provider_assigned' then raise exception 'assignment_cannot_be_removed_after_departure'; end if;
 update public.business_bookings set assigned_provider_id=null,status='confirmed',assigned_at=null,provider_acceptance='not_sent',
 provider_notification_status='not_sent',estimated_arrival_start=null,estimated_arrival_end=null,updated_at=now() where id=target_booking returning * into result;
 insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
 values(auth.uid(),'provider_unassigned','business_booking',target_booking,jsonb_build_object('provider_id',old.assigned_provider_id),jsonb_build_object('status','confirmed'));
 return result;
end $$;

create or replace function public.admin_confirm_booking_price(target_booking uuid,price_pence integer,override_reason text default null)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare old public.business_bookings; result public.business_bookings; overridden boolean;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if price_pence is null or price_pence<=0 then raise exception 'invalid_price'; end if;
 select * into old from public.business_bookings where id=target_booking for update;
 if old.status not in ('requested','under_review','awaiting_customer_confirmation') then raise exception 'booking_not_awaiting_price_review'; end if;
 overridden := old.estimated_price_pence is distinct from price_pence;
 if overridden and length(trim(coalesce(override_reason,'')))<5 then raise exception 'override_reason_required'; end if;
 update public.business_bookings set agreed_price_pence=price_pence,price_pence=price_pence,price_override_reason=case when overridden then trim(override_reason) end,
  price_overridden_by=case when overridden then auth.uid() end,price_overridden_at=case when overridden then now() end,
  customer_price_accepted=not overridden,customer_price_accepted_at=case when not overridden then now() end,
  status=case when overridden then 'awaiting_customer_confirmation' else 'confirmed' end,updated_at=now()
 where id=target_booking returning * into result;
 insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
 values(auth.uid(),case when overridden then 'price_change_requested' else 'booking_confirmed' end,'business_booking',target_booking,
 jsonb_build_object('price',old.agreed_price_pence,'status',old.status),jsonb_build_object('price',price_pence,'status',result.status,'reason',override_reason));
 return result;
end $$;

create or replace function public.customer_accept_booking_change(target_booking uuid)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare old public.business_bookings; result public.business_bookings;
begin
 select * into old from public.business_bookings where id=target_booking and public.is_business_member(account_id) for update;
 if old.id is null then raise exception 'booking_not_found' using errcode='42501'; end if;
 if old.status<>'awaiting_customer_confirmation' then raise exception 'booking_not_awaiting_customer'; end if;
 update public.business_bookings set customer_price_accepted=true,customer_price_accepted_at=now(),status='confirmed',updated_at=now()
 where id=target_booking returning * into result;
 insert into public.booking_events(account_id,booking_id,event_type,actor_user_id,metadata)
 values(result.account_id,result.id,'customer_change_accepted',auth.uid(),jsonb_build_object('agreed_price_pence',result.agreed_price_pence));
 return result;
end $$;

create or replace function public.admin_update_booking_operations(target_booking uuid,note_internal text,note_customer text,arrival_start timestamptz,arrival_end timestamptz)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare old public.business_bookings; result public.business_bookings;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if arrival_end is not null and arrival_start is null then raise exception 'arrival_start_required'; end if;
 if arrival_end is not null and arrival_end<arrival_start then raise exception 'invalid_arrival_window'; end if;
 select * into old from public.business_bookings where id=target_booking for update;
 update public.business_bookings set internal_notes=nullif(trim(note_internal),''),customer_update=nullif(trim(note_customer),''),
  estimated_arrival_start=arrival_start,estimated_arrival_end=arrival_end,updated_at=now() where id=target_booking returning * into result;
 if row(old.internal_notes,old.customer_update,old.estimated_arrival_start,old.estimated_arrival_end)
   is distinct from row(result.internal_notes,result.customer_update,result.estimated_arrival_start,result.estimated_arrival_end) then
  insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
  values(auth.uid(),'booking_operations_updated','business_booking',target_booking,
   jsonb_build_object('internal_notes',old.internal_notes,'customer_update',old.customer_update,'arrival_start',old.estimated_arrival_start,'arrival_end',old.estimated_arrival_end),
   jsonb_build_object('internal_notes',result.internal_notes,'customer_update',result.customer_update,'arrival_start',result.estimated_arrival_start,'arrival_end',result.estimated_arrival_end));
 end if; return result;
end $$;

revoke all on function public.admin_transition_booking(uuid,text,text,text),public.customer_accept_booking_change(uuid),public.admin_update_booking_operations(uuid,text,text,timestamptz,timestamptz) from public;
grant execute on function public.admin_transition_booking(uuid,text,text,text),public.admin_update_booking_operations(uuid,text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.customer_accept_booking_change(uuid) to authenticated;
drop function if exists public.admin_transition_booking(uuid,text);
