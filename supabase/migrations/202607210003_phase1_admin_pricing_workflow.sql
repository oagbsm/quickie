-- Phase 1: canonical business-booking workflow, authenticated admins, pricing and audit trail.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','operator')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "admins view own role" on public.admin_users for select to authenticated using (user_id = auth.uid() and active);

create or replace function public.is_quickola_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users a where a.user_id = auth.uid() and a.active);
$$;
revoke all on function public.is_quickola_admin() from public;
grant execute on function public.is_quickola_admin() to authenticated;

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text, phone text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  service_area text[] not null default array['SL1','SL2','SL3'],
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.service_providers enable row level security;
create policy "admins manage service providers" on public.service_providers for all to authenticated
  using (public.is_quickola_admin()) with check (public.is_quickola_admin());

-- Safely map every legacy portal status into the canonical lifecycle.
alter table public.business_bookings drop constraint if exists business_bookings_status_check;
update public.business_bookings set status = case status
  when 'draft' then 'requested'
  when 'submitted' then 'requested'
  when 'awaiting_review' then 'under_review'
  when 'quoted' then 'under_review'
  when 'cover_required' then 'under_review'
  when 'issue_reported' then 'under_review'
  else status end;
alter table public.business_bookings alter column status set default 'requested';
alter table public.business_bookings add constraint business_bookings_status_check
  check (status in ('requested','under_review','confirmed','assigned','in_progress','completed','cancelled'));

alter table public.business_bookings add column if not exists extras jsonb not null default '[]'::jsonb;
alter table public.business_bookings add column if not exists pricing_version text;
alter table public.business_bookings add column if not exists pricing_mode text check (pricing_mode in ('instant','manual_review'));
alter table public.business_bookings add column if not exists pricing_breakdown jsonb;
alter table public.business_bookings add column if not exists estimated_price_pence integer check (estimated_price_pence >= 0);
alter table public.business_bookings add column if not exists estimated_price_max_pence integer check (estimated_price_max_pence >= 0);
alter table public.business_bookings add column if not exists agreed_price_pence integer check (agreed_price_pence >= 0);
alter table public.business_bookings add column if not exists requires_manual_review boolean not null default false;
alter table public.business_bookings add column if not exists price_override_reason text;
alter table public.business_bookings add column if not exists price_overridden_by uuid references auth.users(id);
alter table public.business_bookings add column if not exists price_overridden_at timestamptz;
alter table public.business_bookings add column if not exists customer_price_accepted boolean not null default false;
alter table public.business_bookings add column if not exists customer_price_accepted_at timestamptz;
alter table public.business_bookings add column if not exists assigned_at timestamptz;
alter table public.business_bookings add column if not exists provider_acceptance text not null default 'not_sent'
  check (provider_acceptance in ('not_sent','pending','accepted','declined'));
alter table public.business_bookings add column if not exists provider_notification_status text not null default 'not_sent'
  check (provider_notification_status in ('not_sent','sent','failed'));

drop policy if exists "members request bookings" on public.business_bookings;
drop policy if exists "members request canonical bookings" on public.business_bookings;

drop policy if exists "members manage coverage requests" on public.service_area_requests;
create policy "members view coverage requests" on public.service_area_requests for select to authenticated using (public.is_business_member(account_id));
create policy "members create coverage requests" on public.service_area_requests for insert to authenticated with check (
  public.is_business_member(account_id) and status='requested'
);

do $$ begin
  if not exists(select 1 from pg_constraint where conname='business_bookings_service_provider_fkey') then
    alter table public.business_bookings add constraint business_bookings_service_provider_fkey
      foreign key (assigned_provider_id) references public.service_providers(id) on delete set null;
  end if;
end $$;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id),
  action text not null, entity_type text not null, entity_id uuid not null,
  previous_value jsonb, new_value jsonb, created_at timestamptz not null default now()
);
create index if not exists admin_audit_entity_idx on public.admin_audit_log(entity_type,entity_id,created_at desc);
alter table public.admin_audit_log enable row level security;
create policy "admins view audit log" on public.admin_audit_log for select to authenticated using (public.is_quickola_admin());

create policy "admins view business accounts" on public.business_accounts for select to authenticated using (public.is_quickola_admin());
create policy "admins view business members" on public.business_members for select to authenticated using (public.is_quickola_admin());
create policy "admins view properties" on public.properties for select to authenticated using (public.is_quickola_admin());
create policy "admins view business bookings" on public.business_bookings for select to authenticated using (public.is_quickola_admin());
create policy "admins view completion reports" on public.completion_reports for select to authenticated using (public.is_quickola_admin());
create policy "admins view booking photos" on public.booking_photos for select to authenticated using (public.is_quickola_admin());
create policy "admins view business notifications" on public.business_notifications for select to authenticated using (public.is_quickola_admin());

create or replace function public.admin_transition_booking(target_booking uuid, next_status text)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings; valid boolean;
begin
  if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  select * into current_row from public.business_bookings where id=target_booking for update;
  if current_row.id is null then raise exception 'booking_not_found'; end if;
  valid := (current_row.status='requested' and next_status in ('under_review','confirmed','cancelled'))
    or (current_row.status='under_review' and next_status in ('confirmed','cancelled'))
    or (current_row.status='confirmed' and next_status in ('assigned','cancelled'))
    or (current_row.status='assigned' and next_status in ('in_progress','confirmed','cancelled'))
    or (current_row.status='in_progress' and next_status in ('completed','cancelled'));
  if not valid then raise exception 'invalid_status_transition:%->%',current_row.status,next_status; end if;
  if next_status='assigned' and current_row.assigned_provider_id is null then raise exception 'provider_required'; end if;
  if next_status='completed' and not exists(select 1 from public.completion_reports r where r.booking_id=target_booking) then raise exception 'completion_evidence_required'; end if;
  update public.business_bookings set status=next_status,updated_at=now() where id=target_booking returning * into updated_row;
  insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
  values(auth.uid(),'booking_status_changed','business_booking',target_booking,jsonb_build_object('status',current_row.status),jsonb_build_object('status',next_status));
  return updated_row;
end $$;

create or replace function public.admin_assign_provider(target_booking uuid, target_provider uuid)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings;
begin
  if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if not exists(select 1 from public.service_providers p where p.id=target_provider and p.status='active') then raise exception 'provider_unavailable'; end if;
  select * into current_row from public.business_bookings where id=target_booking for update;
  if current_row.status not in ('confirmed','assigned') then raise exception 'booking_must_be_confirmed'; end if;
  update public.business_bookings set assigned_provider_id=target_provider,status='assigned',assigned_at=now(),provider_acceptance='pending',provider_notification_status='not_sent',updated_at=now()
  where id=target_booking returning * into updated_row;
  insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
  values(auth.uid(),case when current_row.assigned_provider_id is null then 'provider_assigned' else 'provider_changed' end,'business_booking',target_booking,
    jsonb_build_object('provider_id',current_row.assigned_provider_id,'status',current_row.status),jsonb_build_object('provider_id',target_provider,'status','assigned'));
  return updated_row;
end $$;

create or replace function public.admin_unassign_provider(target_booking uuid)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings;
begin
  if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  select * into current_row from public.business_bookings where id=target_booking for update;
  if current_row.status<>'assigned' then raise exception 'booking_not_assigned'; end if;
  update public.business_bookings set assigned_provider_id=null,status='confirmed',assigned_at=null,provider_acceptance='not_sent',provider_notification_status='not_sent',updated_at=now()
  where id=target_booking returning * into updated_row;
  insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
  values(auth.uid(),'provider_unassigned','business_booking',target_booking,jsonb_build_object('provider_id',current_row.assigned_provider_id,'status','assigned'),jsonb_build_object('provider_id',null,'status','confirmed'));
  return updated_row;
end $$;

create or replace function public.admin_confirm_booking_price(target_booking uuid, price_pence integer, override_reason text default null)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
declare current_row public.business_bookings; updated_row public.business_bookings; overridden boolean;
begin
  if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if price_pence is null or price_pence<0 then raise exception 'invalid_price'; end if;
  select * into current_row from public.business_bookings where id=target_booking for update;
  overridden := current_row.estimated_price_pence is distinct from price_pence;
  if overridden and coalesce(length(trim(override_reason)),0)<5 then raise exception 'override_reason_required'; end if;
  update public.business_bookings set agreed_price_pence=price_pence,price_pence=price_pence,
    price_override_reason=case when overridden then trim(override_reason) else null end,
    price_overridden_by=case when overridden then auth.uid() else null end,price_overridden_at=case when overridden then now() else null end,
    status=case when status in ('requested','under_review') then 'confirmed' else status end,updated_at=now()
  where id=target_booking returning * into updated_row;
  insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
  values(auth.uid(),case when overridden then 'booking_price_overridden' else 'booking_price_confirmed' end,'business_booking',target_booking,
    jsonb_build_object('agreed_price_pence',current_row.agreed_price_pence),jsonb_build_object('agreed_price_pence',price_pence,'reason',override_reason));
  return updated_row;
end $$;

revoke all on function public.admin_transition_booking(uuid,text),public.admin_assign_provider(uuid,uuid),public.admin_unassign_provider(uuid),public.admin_confirm_booking_price(uuid,integer,text) from public;
grant execute on function public.admin_transition_booking(uuid,text),public.admin_assign_provider(uuid,uuid),public.admin_unassign_provider(uuid),public.admin_confirm_booking_price(uuid,integer,text) to authenticated;

create index if not exists business_bookings_status_date_idx on public.business_bookings(status,scheduled_start);
create index if not exists business_bookings_provider_idx on public.business_bookings(assigned_provider_id,status);
