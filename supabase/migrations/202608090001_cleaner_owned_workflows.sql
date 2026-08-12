-- Cleaner-owned properties and cleans use the existing STR operational tables.
-- A private workspace shell supplies the legacy account_id FK; it does not
-- create a business_members row or grant operator access.

alter table public.cleaner_profiles
  add column if not exists workspace_account_id uuid references public.business_accounts(id) on delete cascade;

alter table public.properties
  add column if not exists standalone_cleaner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists host_name text,
  add column if not exists host_email text,
  add column if not exists host_phone text;

alter table public.work_items
  add column if not exists standalone_cleaner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists creation_key text,
  add column if not exists host_name text,
  add column if not exists host_email text,
  add column if not exists host_phone text;

create unique index if not exists cleaner_profile_workspace_unique
  on public.cleaner_profiles(workspace_account_id)
  where workspace_account_id is not null;
create unique index if not exists cleaner_property_identity_unique
  on public.properties(standalone_cleaner_user_id, lower(trim(nickname)), lower(trim(address_line_1)))
  where standalone_cleaner_user_id is not null;
create unique index if not exists cleaner_work_item_creation_key_unique
  on public.work_items(standalone_cleaner_user_id, creation_key)
  where standalone_cleaner_user_id is not null and creation_key is not null;
create index if not exists cleaner_properties_owner_idx
  on public.properties(standalone_cleaner_user_id, created_at desc)
  where standalone_cleaner_user_id is not null;
create index if not exists cleaner_work_items_owner_idx
  on public.work_items(standalone_cleaner_user_id, access_start_at desc)
  where standalone_cleaner_user_id is not null;

create or replace function public.is_standalone_cleaner(target_account uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.cleaner_profiles profile
    where profile.user_id = auth.uid()
      and profile.workspace_account_id = target_account
      and profile.role = 'cleaner'
  )
$$;
revoke all on function public.is_standalone_cleaner(uuid) from public;
grant execute on function public.is_standalone_cleaner(uuid) to authenticated;

-- Replace the earlier initializer so old direct accounts are backfilled safely.
create or replace function public.initialize_direct_cleaner_profile()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  metadata jsonb;
  profile public.cleaner_profiles;
  workspace uuid;
  display text;
begin
  if current_user_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select raw_user_meta_data into metadata from auth.users where id = current_user_id;
  if coalesce(metadata->>'account_kind', '') <> 'quickola_cleaner' then
    raise exception 'direct_cleaner_account_required' using errcode = '42501';
  end if;
  if exists (select 1 from public.business_members where user_id = current_user_id) then
    raise exception 'business_user_cannot_become_direct_cleaner' using errcode = '42501';
  end if;
  if exists (select 1 from public.workers where user_id = current_user_id) then return null; end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  select * into profile from public.cleaner_profiles where user_id = current_user_id for update;
  if profile.workspace_account_id is not null then return current_user_id; end if;
  display := coalesce(nullif(trim(metadata->>'full_name'), ''), 'Cleaner');
  insert into public.business_accounts(name, customer_type)
  values (left(display || '''s Quickola cleans', 160), 'other')
  returning id into workspace;
  if profile.user_id is null then
    insert into public.cleaner_profiles(user_id, role, display_name, workspace_account_id)
    values (current_user_id, 'cleaner', display, workspace);
  else
    update public.cleaner_profiles
       set workspace_account_id = workspace, updated_at = now()
     where user_id = current_user_id;
  end if;
  return current_user_id;
end;
$$;
revoke all on function public.initialize_direct_cleaner_profile() from public, anon;
grant execute on function public.initialize_direct_cleaner_profile() to authenticated;

drop policy if exists "standalone cleaners view own properties" on public.properties;
create policy "standalone cleaners view own properties" on public.properties
  for select to authenticated using (standalone_cleaner_user_id = auth.uid());
drop policy if exists "standalone cleaners update own properties" on public.properties;
create policy "standalone cleaners update own properties" on public.properties
  for update to authenticated
  using (standalone_cleaner_user_id = auth.uid())
  with check (standalone_cleaner_user_id = auth.uid());
drop policy if exists "standalone cleaners delete own properties" on public.properties;
create policy "standalone cleaners delete own properties" on public.properties
  for delete to authenticated using (standalone_cleaner_user_id = auth.uid());

drop policy if exists "standalone cleaners view own work items" on public.work_items;
create policy "standalone cleaners view own work items" on public.work_items
  for select to authenticated using (standalone_cleaner_user_id = auth.uid());

drop policy if exists "standalone cleaners view own checklist tasks" on public.checklist_tasks;
create policy "standalone cleaners view own checklist tasks" on public.checklist_tasks
  for select to authenticated using (
    exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid())
  );
drop policy if exists "standalone cleaners update own checklist tasks" on public.checklist_tasks;
create policy "standalone cleaners update own checklist tasks" on public.checklist_tasks
  for update to authenticated
  using (exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid()))
  with check (exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid()));

drop policy if exists "standalone cleaners view own evidence" on public.evidence_submissions;
create policy "standalone cleaners view own evidence" on public.evidence_submissions
  for select to authenticated using (
    uploader_id = auth.uid() or exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid())
  );
drop policy if exists "standalone cleaners add own evidence" on public.evidence_submissions;
create policy "standalone cleaners add own evidence" on public.evidence_submissions
  for insert to authenticated with check (
    uploader_id = auth.uid()
    and exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid())
  );

drop policy if exists "standalone cleaners view own issues" on public.operational_issues;
create policy "standalone cleaners view own issues" on public.operational_issues
  for select to authenticated using (created_by = auth.uid() or exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid()));
drop policy if exists "standalone cleaners add own issues" on public.operational_issues;
create policy "standalone cleaners add own issues" on public.operational_issues
  for insert to authenticated with check (
    created_by = auth.uid()
    and exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid())
  );
drop policy if exists "standalone cleaners view own activity" on public.activity_events;
create policy "standalone cleaners view own activity" on public.activity_events
  for select to authenticated using (actor_user_id = auth.uid() or exists(select 1 from public.work_items item where item.id = work_item_id and item.standalone_cleaner_user_id = auth.uid()));

drop policy if exists "standalone cleaners read own turnover evidence" on storage.objects;
create policy "standalone cleaners read own turnover evidence" on storage.objects
  for select to authenticated using (
    bucket_id = 'turnover-evidence'
    and exists(select 1 from public.work_items item where item.id = ((storage.foldername(name))[2])::uuid and item.account_id = ((storage.foldername(name))[1])::uuid and item.standalone_cleaner_user_id = auth.uid())
  );
drop policy if exists "standalone cleaners upload own turnover evidence" on storage.objects;
create policy "standalone cleaners upload own turnover evidence" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'turnover-evidence'
    and exists(select 1 from public.work_items item where item.id = ((storage.foldername(name))[2])::uuid and item.account_id = ((storage.foldername(name))[1])::uuid and item.standalone_cleaner_user_id = auth.uid())
  );

create or replace function public.create_cleaner_property(
  property_name text, property_address text, property_bedrooms integer, property_bathrooms numeric,
  property_postcode text default null, property_host_name text default null, property_host_email text default null,
  property_host_phone text default null, property_notes text default null, property_access_notes text default null,
  property_parking_notes text default null, property_linen_notes text default null
) returns public.properties language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); account uuid; result public.properties;
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.cleaner_profiles where user_id = current_user_id and role = 'cleaner') then raise exception 'cleaner_profile_required'; end if;
  perform public.initialize_direct_cleaner_profile();
  select workspace_account_id into account from public.cleaner_profiles where user_id = current_user_id;
  if nullif(trim(property_name), '') is null or nullif(trim(property_address), '') is null then raise exception 'property_name_and_address_required'; end if;
  if property_bedrooms is null or property_bedrooms < 0 or property_bedrooms > 100 then raise exception 'invalid_bedrooms'; end if;
  if property_bathrooms is null or property_bathrooms <= 0 or property_bathrooms > 100 then raise exception 'invalid_bathrooms'; end if;
  insert into public.properties(account_id, standalone_cleaner_user_id, nickname, address_line_1, city, postcode, property_type, access_method, bedrooms, bathrooms, internal_notes, access_notes, parking_notes, linen_requirements, default_service)
  values(account, current_user_id, trim(property_name), trim(property_address), coalesce(nullif(trim(property_postcode), ''), trim(property_address)), coalesce(nullif(trim(property_postcode), ''), trim(property_address)), 'airbnb', 'host_provided', property_bedrooms, property_bathrooms, nullif(trim(property_notes), ''), nullif(trim(property_access_notes), ''), nullif(trim(property_parking_notes), ''), nullif(trim(property_linen_notes), ''), 'str_turnover')
  returning * into result;
  insert into public.activity_events(account_id, property_id, actor_user_id, event_type, description) values(account, result.id, current_user_id, 'cleaner_property_created', 'Cleaner saved a property');
  return result;
exception when unique_violation then raise exception 'property_already_exists';
end;
$$;
revoke all on function public.create_cleaner_property(text,text,integer,numeric,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_cleaner_property(text,text,integer,numeric,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.create_cleaner_work_item(
  target_property uuid, creation_key text, clean_date date, clean_start timestamptz, clean_end timestamptz,
  guest_checkin timestamptz default null, clean_notes text default null, clean_host_name text default null,
  clean_host_email text default null, clean_host_phone text default null
) returns public.work_items language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); account uuid; property_row public.properties; result public.work_items;
declare checkin timestamptz; checkout timestamptz; duration integer;
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  perform public.initialize_direct_cleaner_profile();
  select * into property_row from public.properties where id = target_property and standalone_cleaner_user_id = current_user_id for update;
  if property_row.id is null then raise exception 'property_not_owned'; end if;
  if nullif(trim(creation_key), '') is not null then
    select * into result from public.work_items where standalone_cleaner_user_id = current_user_id and creation_key = trim(creation_key);
    if result.id is not null then return result; end if;
  end if;
  if clean_start is null or clean_end is null or clean_end <= clean_start then raise exception 'clean_window_invalid'; end if;
  checkin := coalesce(guest_checkin, clean_end + interval '1 minute'); checkout := clean_start - interval '1 minute'; duration := greatest(15, ceil(extract(epoch from (clean_end - clean_start)) / 60)::integer);
  select workspace_account_id into account from public.cleaner_profiles where user_id = current_user_id;
  insert into public.work_items(account_id, property_id, standalone_cleaner_user_id, creation_key, property_public_name, property_general_area, cleaning_type, turnover_date, guest_checkout_at, access_start_at, window_end_at, next_checkin_at, estimated_duration_minutes, notes, required_evidence_count, risk_acknowledged, status, created_by, host_name, host_email, host_phone)
  values(account, property_row.id, current_user_id, nullif(trim(creation_key), ''), property_row.nickname, coalesce(nullif(property_row.postcode, ''), property_row.city), 'standard_turnover', clean_date, checkout, clean_start, clean_end, checkin, duration, nullif(trim(clean_notes), ''), property_row.required_completion_photos, true, 'accepted', current_user_id, nullif(trim(clean_host_name), ''), nullif(lower(trim(clean_host_email)), ''), nullif(trim(clean_host_phone), ''))
  returning * into result;
  perform public.snapshot_work_item_checklist(result.id);
  insert into public.activity_events(account_id, work_item_id, property_id, actor_user_id, event_type, description) values(account, result.id, result.property_id, current_user_id, 'cleaner_clean_created', 'Cleaner added a clean');
  return result;
exception when unique_violation then
  select * into result from public.work_items where standalone_cleaner_user_id = current_user_id and creation_key = trim(creation_key);
  if result.id is not null then return result; end if;
  raise exception 'clean_already_exists';
end;
$$;
revoke all on function public.create_cleaner_work_item(uuid,text,date,timestamptz,timestamptz,timestamptz,text,text,text,text) from public, anon;
grant execute on function public.create_cleaner_work_item(uuid,text,date,timestamptz,timestamptz,timestamptz,text,text,text,text) to authenticated;

create or replace function public.evaluate_work_item_readiness(target_work_item uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item public.work_items; missing_tasks integer; missing_task_photos integer; missing_notes integer; failed_blocking_tasks integer; evidence_count integer; blocking_issues integer; key_required boolean; key_count integer; reasons jsonb := '[]'::jsonb; decision boolean;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_business_member(item.account_id) or public.is_assigned_worker(item.id) or item.standalone_cleaner_user_id=auth.uid()) then raise exception 'forbidden'; end if;
  select count(*) into missing_tasks from public.checklist_tasks where work_item_id=item.id and mandatory and not completed;
  select count(*) into missing_task_photos from public.checklist_tasks t where t.work_item_id=item.id and t.photo_required and not exists(select 1 from public.evidence_submissions e where e.checklist_task_id=t.id and nullif(trim(e.storage_path),'') is not null);
  select count(*) into missing_notes from public.checklist_tasks where work_item_id=item.id and note_required and nullif(trim(note),'') is null;
  select count(*) into failed_blocking_tasks from public.checklist_tasks where work_item_id=item.id and blocking and response_type in ('yes_no','pass_fail') and response in ('no','fail');
  select count(*) into evidence_count from public.evidence_submissions where work_item_id=item.id and evidence_type='completion_photo';
  select count(*) into blocking_issues from public.operational_issues where work_item_id=item.id and blocking and status not in ('resolved','closed');
  select exists(select 1 from public.checklist_tasks where work_item_id=item.id and label ilike '%key%return%' and mandatory) into key_required;
  select count(*) into key_count from public.evidence_submissions where work_item_id=item.id and evidence_type='key_return';
  if item.completion_submitted_at is null then reasons := reasons || '"Completion has not been submitted"'::jsonb; end if;
  if missing_tasks>0 then reasons := reasons || to_jsonb(missing_tasks||' mandatory checklist task'||case when missing_tasks=1 then ' is' else 's are' end||' incomplete'); end if;
  if missing_task_photos>0 then reasons := reasons || to_jsonb(missing_task_photos||' task photo'||case when missing_task_photos=1 then ' is' else 's are' end||' missing'); end if;
  if missing_notes>0 then reasons := reasons || to_jsonb(missing_notes||' required note'||case when missing_notes=1 then ' is' else 's are' end||' missing'); end if;
  if failed_blocking_tasks>0 then reasons := reasons || to_jsonb(failed_blocking_tasks||' blocking checklist result'||case when failed_blocking_tasks=1 then ' requires' else 's require' end||' attention'); end if;
  if evidence_count<item.required_evidence_count then reasons := reasons || to_jsonb((item.required_evidence_count-evidence_count)||' completion photo'||case when item.required_evidence_count-evidence_count=1 then ' is' else 's are' end||' missing'); end if;
  if key_required and key_count=0 then reasons := reasons || '"Key-return confirmation is missing"'::jsonb; end if;
  if blocking_issues>0 then reasons := reasons || to_jsonb(blocking_issues||' blocking issue'||case when blocking_issues=1 then ' remains' else 's remain' end||' open'); end if;
  decision := jsonb_array_length(reasons)=0;
  update public.work_items set readiness_decision=decision,readiness_evaluated_at=now(),readiness_result=jsonb_build_object('ready',decision,'blocking_reasons',reasons,'mandatory_tasks_missing',missing_tasks,'task_photos_missing',missing_task_photos,'required_photos_missing',greatest(item.required_evidence_count-evidence_count,0),'blocking_issues',blocking_issues),ready_at=case when decision then coalesce(ready_at,now()) else null end,status=case when decision then 'ready' when completion_submitted_at is not null then 'action_required' else status end,updated_at=now() where id=item.id;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description,metadata) values(item.account_id,item.id,auth.uid(),'readiness_evaluated',case when decision then 'Property marked ready' else 'Property readiness check found outstanding requirements' end,jsonb_build_object('ready',decision,'blocking_reasons',reasons));
  return jsonb_build_object('ready',decision,'blocking_reasons',reasons);
end;
$$;

create or replace function public.transition_work_item(target_work_item uuid, next_status text)
returns public.work_items language plpgsql security definer set search_path = '' as $$
declare current_row public.work_items; result public.work_items; allowed boolean := false; owner_actor boolean; worker_actor boolean; standalone_actor boolean;
begin
  select * into current_row from public.work_items where id=target_work_item for update;
  if current_row.id is null then raise exception 'work_item_not_found'; end if;
  owner_actor := public.is_business_member(current_row.account_id); worker_actor := public.is_assigned_worker(current_row.id); standalone_actor := current_row.standalone_cleaner_user_id=auth.uid();
  if not (owner_actor or worker_actor or standalone_actor) then raise exception 'forbidden'; end if;
  if current_row.status=next_status then return current_row; end if;
  if next_status in ('accepted','declined','en_route','arrived','in_progress','evidence_submitted') and not (worker_actor or standalone_actor) then raise exception 'assigned_worker_required'; end if;
  allowed := case current_row.status when 'awaiting_response' then next_status in ('accepted','declined','cancelled') when 'accepted' then next_status in ('en_route','cancelled') when 'en_route' then next_status in ('arrived','cancelled') when 'arrived' then next_status in ('in_progress','cancelled') when 'in_progress' then next_status in ('evidence_submitted','action_required','cancelled') when 'evidence_submitted' then next_status in ('action_required','cancelled') when 'declined' then next_status in ('unassigned','awaiting_response','cancelled') when 'unassigned' then next_status in ('awaiting_response','cancelled') when 'action_required' then next_status in ('in_progress','cancelled') else false end;
  if not allowed then raise exception 'invalid_status_transition:%->%',current_row.status,next_status; end if;
  if next_status in ('accepted','declined') then update public.assignments set status=next_status,responded_at=now() where work_item_id=target_work_item and status='pending'; end if;
  if next_status='evidence_submitted' then update public.work_items set completion_submitted_at=now() where id=target_work_item; end if;
  update public.work_items set status=next_status,actual_started_at=case when next_status='in_progress' then coalesce(actual_started_at,now()) else actual_started_at end,actual_completed_at=case when next_status='evidence_submitted' then now() else actual_completed_at end,updated_at=now() where id=target_work_item returning * into result;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description) values(result.account_id,result.id,auth.uid(),'turnover_'||next_status,'Turnover status changed to '||replace(next_status,'_',' '));
  if next_status='evidence_submitted' then perform public.evaluate_work_item_readiness(target_work_item); end if;
  return result;
end;
$$;

-- Allow the canonical room snapshotter to serve cleaner-owned properties.
create or replace function public.snapshot_work_item_checklist(target_work_item uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare item public.work_items; property_row public.properties; selected_template_id uuid; section_row record; task_row record; room_count integer; room_index integer; room_id uuid; inserted_count integer := 0;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null or not (public.is_business_member(item.account_id) or item.standalone_cleaner_user_id = auth.uid()) then raise exception 'forbidden'; end if;
  if exists(select 1 from public.checklist_tasks where work_item_id = item.id) then return 0; end if;
  select * into property_row from public.properties where id = item.property_id and account_id = item.account_id;
  select t.id into selected_template_id from public.checklist_templates t where t.property_id = item.property_id and t.account_id = item.account_id and t.active order by t.version desc, t.created_at desc limit 1;
  if selected_template_id is null then return 0; end if;
  for section_row in select * from public.checklist_template_sections where template_id = selected_template_id order by position loop
    room_count := case section_row.room_type when 'bedroom' then greatest(coalesce(property_row.bedrooms, 0), 0) when 'bathroom' then greatest(floor(coalesce(property_row.bathrooms, 0)), 0)::integer else 1 end;
    if room_count = 0 then continue; end if;
    for room_index in 1..room_count loop
      room_id := gen_random_uuid();
      for task_row in select * from public.checklist_template_tasks where section_id = section_row.id order by position loop
        insert into public.checklist_tasks(account_id, work_item_id, source_task_id, section_title, label, description, position, response_type, mandatory, photo_required, note_required, blocking, room_type, room_index, room_instance_id)
        values(item.account_id, item.id, task_row.id, case when section_row.room_type in ('bedroom','bathroom') then initcap(replace(section_row.room_type,'_',' ')) || ' ' || room_index else section_row.title end, task_row.label, task_row.description, section_row.position * 100000 + room_index * 1000 + task_row.position, task_row.response_type, task_row.mandatory, task_row.photo_required, task_row.note_required, task_row.blocking, section_row.room_type, case when section_row.room_type in ('bedroom','bathroom') then room_index else null end, room_id);
        inserted_count := inserted_count + 1;
      end loop;
    end loop;
  end loop;
  return inserted_count;
end;
$$;

-- Cleaner-owned jobs may use the existing transition and checklist RPCs.
create or replace function public.cleaner_update_checklist_task(target_task uuid, target_work_item uuid, next_response text, next_note text)
returns public.checklist_tasks language plpgsql security definer set search_path = '' as $$
declare item public.work_items; task public.checklist_tasks; result public.checklist_tasks;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null or not (public.is_assigned_worker(item.id) or item.standalone_cleaner_user_id = auth.uid()) then raise exception 'forbidden'; end if;
  if item.status not in ('in_progress','action_required') then raise exception 'checklist_not_active'; end if;
  select * into task from public.checklist_tasks where id = target_task and work_item_id = target_work_item;
  if task.id is null then raise exception 'checklist_task_not_found'; end if;
  if task.note_required and nullif(trim(coalesce(next_note,'')),'') is null then raise exception 'task_note_required'; end if;
  if task.response_type = 'yes_no' and coalesce(next_response,'') not in ('yes','no') then raise exception 'task_response_required'; end if;
  if task.response_type = 'pass_fail' and coalesce(next_response,'') not in ('pass','fail') then raise exception 'task_response_required'; end if;
  if (task.photo_required or task.label ilike '%key%return%') and not exists(select 1 from public.evidence_submissions e where e.work_item_id = target_work_item and e.checklist_task_id = target_task and nullif(trim(e.storage_path),'') is not null) then raise exception 'task_photo_required'; end if;
  update public.checklist_tasks set completed=true,response=next_response,note=nullif(trim(coalesce(next_note,'')),''),completed_by=auth.uid(),completed_at=now() where id=target_task and work_item_id=target_work_item returning * into result;
  perform public.evaluate_work_item_readiness(target_work_item); return result;
end;
$$;

-- Reports are deterministic per work item and contain no access/private notes.
create table if not exists public.work_item_completion_reports (
  id uuid primary key default gen_random_uuid(), work_item_id uuid not null unique references public.work_items(id) on delete cascade,
  account_id uuid not null references public.business_accounts(id) on delete cascade, cleaner_user_id uuid not null references auth.users(id) on delete cascade,
  report_reference text not null unique, report_data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.work_item_completion_reports enable row level security;
create policy "cleaners view own completion reports" on public.work_item_completion_reports for select to authenticated using (cleaner_user_id = auth.uid());
create index if not exists completion_reports_cleaner_idx on public.work_item_completion_reports(cleaner_user_id, created_at desc);

create table if not exists public.work_item_report_shares (
  id uuid primary key default gen_random_uuid(), report_id uuid not null references public.work_item_completion_reports(id) on delete cascade,
  token_hash text not null unique, created_by uuid not null references auth.users(id), expires_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.work_item_report_shares enable row level security;
create policy "cleaners view own report shares" on public.work_item_report_shares for select to authenticated using (created_by = auth.uid());

create or replace function public.create_work_item_completion_report(target_work_item uuid)
returns public.work_item_completion_reports language plpgsql security definer set search_path = '' as $$
declare item public.work_items; property_row public.properties; result public.work_item_completion_reports; owner uuid; payload jsonb; reference text;
begin
  select * into item from public.work_items where id = target_work_item;
  owner := coalesce(item.standalone_cleaner_user_id, auth.uid());
  if item.id is null or not (item.standalone_cleaner_user_id = auth.uid() or public.is_assigned_worker(item.id)) then raise exception 'forbidden'; end if;
  if item.status <> 'ready' then raise exception 'clean_not_completed'; end if;
  select * into property_row from public.properties where id = item.property_id;
  reference := 'QK-' || upper(substr(replace(item.id::text,'-',''),1,10));
  select jsonb_build_object('reference',reference,'property_name',property_row.nickname,'address',concat_ws(', ',property_row.address_line_1,property_row.city,property_row.postcode),'bedrooms',property_row.bedrooms,'bathrooms',property_row.bathrooms,'cleaning_date',item.turnover_date,'cleaning_start',item.access_start_at,'cleaning_end',item.window_end_at,'guest_checkin',item.next_checkin_at,'cleaner_name',coalesce((select profile.display_name from public.cleaner_profiles profile where profile.user_id=owner),(select worker.display_name from public.workers worker where worker.user_id=owner)),'completed_at',coalesce(item.ready_at,item.actual_completed_at),'checklist',(select coalesce(jsonb_agg(to_jsonb(task) order by task.position),'[]'::jsonb) from public.checklist_tasks task where task.work_item_id=item.id),'evidence',(select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'type',e.evidence_type,'task_id',e.checklist_task_id,'storage_path',e.storage_path) order by e.created_at),'[]'::jsonb) from public.evidence_submissions e where e.work_item_id=item.id),'issues',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'title',i.issue_type,'description',i.description,'severity',i.severity,'status',i.status) order by i.created_at),'[]'::jsonb) from public.operational_issues i where i.work_item_id=item.id)) into payload;
  insert into public.work_item_completion_reports(work_item_id,account_id,cleaner_user_id,report_reference,report_data) values(item.id,item.account_id,owner,reference,payload) on conflict(work_item_id) do update set report_data=excluded.report_data,updated_at=now() returning * into result;
  return result;
end;
$$;
revoke all on function public.create_work_item_completion_report(uuid) from public, anon;
grant execute on function public.create_work_item_completion_report(uuid) to authenticated;

create or replace function public.create_work_item_report_share(target_report uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare raw_token text; report public.work_item_completion_reports;
begin
  raw_token := translate(encode(extensions.gen_random_bytes(32),'base64'), E'/+', '-_'); raw_token := replace(raw_token, '=', '');
  select * into report from public.work_item_completion_reports where id=target_report and cleaner_user_id=auth.uid();
  if report.id is null then raise exception 'report_not_found'; end if;
  insert into public.work_item_report_shares(report_id,token_hash,created_by,expires_at) values(target_report,encode(extensions.digest(raw_token,'sha256'),'hex'),auth.uid(),now()+interval '90 days');
  return raw_token;
end;
$$;
revoke all on function public.create_work_item_report_share(uuid) from public, anon;
grant execute on function public.create_work_item_report_share(uuid) to authenticated;

create or replace function public.create_cleaner_issue(target_work_item uuid, issue_title text, issue_description text, issue_severity text default 'medium')
returns public.operational_issues language plpgsql security definer set search_path = '' as $$
declare item public.work_items; result public.operational_issues;
begin
  select * into item from public.work_items where id=target_work_item and standalone_cleaner_user_id=auth.uid();
  if item.id is null or item.status not in ('in_progress','action_required') then raise exception 'clean_not_active'; end if;
  if nullif(trim(issue_title),'') is null or nullif(trim(issue_description),'') is null then raise exception 'issue_details_required'; end if;
  if issue_severity not in ('low','medium','high','critical') then raise exception 'invalid_issue_severity'; end if;
  insert into public.operational_issues(account_id,work_item_id,issue_type,severity,description,created_by) values(item.account_id,item.id,trim(issue_title),issue_severity,trim(issue_description),auth.uid()) returning * into result;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description) values(item.account_id,item.id,auth.uid(),'issue_reported','Cleaner reported an issue');
  return result;
end;
$$;
revoke all on function public.create_cleaner_issue(uuid,text,text,text) from public, anon;
grant execute on function public.create_cleaner_issue(uuid,text,text,text) to authenticated;
