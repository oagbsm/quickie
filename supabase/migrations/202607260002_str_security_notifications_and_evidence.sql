-- Security and workflow hardening for the STR coordination core.
-- This migration is additive/corrective and may be applied after 202607260001.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('property-images','property-images',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "owners read property images" on storage.objects;
create policy "owners read property images" on storage.objects for select to authenticated
using(bucket_id='property-images' and public.is_business_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "owners upload property images" on storage.objects;
create policy "owners upload property images" on storage.objects for insert to authenticated
with check(bucket_id='property-images' and public.is_business_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "admins read property images" on storage.objects;
create policy "admins read property images" on storage.objects for select to authenticated
using(bucket_id='property-images' and public.is_quickola_admin());

create or replace function public.is_business_member(target_account uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.business_members member
    join public.business_accounts account on account.id=member.account_id
    where member.account_id=target_account
      and member.user_id=auth.uid()
      and account.suspended_at is null
  )
$$;

create or replace function public.is_assigned_worker(target_work_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.assignments assignment
    join public.workers worker on worker.id=assignment.worker_id
    join public.business_accounts account on account.id=assignment.account_id
    where assignment.work_item_id=target_work_item
      and worker.user_id=auth.uid()
      and assignment.status in ('pending','accepted')
      and worker.status='active'
      and account.suspended_at is null
  )
$$;

create or replace function public.is_accepted_worker(target_work_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1
    from public.assignments a
    join public.workers w on w.id=a.worker_id
    join public.business_accounts account on account.id=a.account_id
    where a.work_item_id=target_work_item
      and w.user_id=auth.uid()
      and a.status='accepted'
      and w.status='active'
      and account.suspended_at is null
  )
$$;

-- A cleaner may see general assignment data while a response is pending, but
-- property rows (including full address and access fields) are available only
-- after acceptance.
drop policy if exists "accepted workers view assigned properties" on public.properties;
create policy "accepted workers view assigned properties"
on public.properties for select to authenticated
using (
  exists(
    select 1
    from public.work_items wi
    where wi.property_id=properties.id
      and public.is_accepted_worker(wi.id)
  )
);

drop policy if exists "workers manage assigned checklist tasks" on public.checklist_tasks;
drop policy if exists "workers view assigned checklist tasks" on public.checklist_tasks;
drop policy if exists "workers update assigned checklist tasks" on public.checklist_tasks;
create policy "workers view assigned checklist tasks"
on public.checklist_tasks for select to authenticated
using (public.is_accepted_worker(work_item_id));
create policy "workers update assigned checklist tasks"
on public.checklist_tasks for update to authenticated
using (public.is_accepted_worker(work_item_id))
with check (public.is_accepted_worker(work_item_id));

drop policy if exists "workers add assigned evidence" on public.evidence_submissions;
create policy "workers add accepted evidence"
on public.evidence_submissions for insert to authenticated
with check (
  uploader_id=auth.uid()
  and public.is_accepted_worker(work_item_id)
);

drop policy if exists "assigned workers upload turnover evidence" on storage.objects;
create policy "accepted workers upload turnover evidence"
on storage.objects for insert to authenticated
with check(
  bucket_id='turnover-evidence'
  and exists(
    select 1
    from public.work_items wi
    where wi.account_id=((storage.foldername(name))[1])::uuid
      and wi.id=((storage.foldername(name))[2])::uuid
      and public.is_accepted_worker(wi.id)
  )
);

drop policy if exists "workers manage assigned issues" on public.operational_issues;
create policy "workers view assigned issues"
on public.operational_issues for select to authenticated
using (public.is_accepted_worker(work_item_id));
create policy "workers create assigned issues"
on public.operational_issues for insert to authenticated
with check (
  created_by=auth.uid()
  and public.is_accepted_worker(work_item_id)
);

alter table public.evidence_submissions
  add column if not exists issue_id uuid references public.operational_issues(id) on delete cascade;
create index if not exists evidence_issue_idx
  on public.evidence_submissions(issue_id) where issue_id is not null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.business_accounts(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid references public.work_items(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_idx
  on public.notifications(recipient_user_id, read_at, created_at desc);
alter table public.notifications enable row level security;
create policy "users view own notifications"
on public.notifications for select to authenticated
using (recipient_user_id=auth.uid());
create policy "users update own notifications"
on public.notifications for update to authenticated
using (recipient_user_id=auth.uid())
with check (recipient_user_id=auth.uid());
create policy "account owners create notifications"
on public.notifications for insert to authenticated
with check (
  account_id is not null
  and public.is_business_member(account_id)
);

create policy "admins view workers" on public.workers for select to authenticated
using (public.is_quickola_admin());
create policy "admins view invitations" on public.worker_invitations for select to authenticated
using (public.is_quickola_admin());
create policy "admins view work items" on public.work_items for select to authenticated
using (public.is_quickola_admin());
create policy "admins view assignments" on public.assignments for select to authenticated
using (public.is_quickola_admin());
create policy "admins view checklist tasks" on public.checklist_tasks for select to authenticated
using (public.is_quickola_admin());
create policy "admins view evidence submissions" on public.evidence_submissions for select to authenticated
using (public.is_quickola_admin());
create policy "admins view operational issues" on public.operational_issues for select to authenticated
using (public.is_quickola_admin());
create policy "admins view activity events" on public.activity_events for select to authenticated
using (public.is_quickola_admin());
create policy "admins view notifications" on public.notifications for select to authenticated
using (public.is_quickola_admin());
create policy "admins read turnover evidence" on storage.objects for select to authenticated
using (bucket_id='turnover-evidence' and public.is_quickola_admin());

create or replace function public.notify_account_owners(
  target_account uuid,
  target_work_item uuid,
  target_event text,
  target_title text,
  target_body text
) returns void language sql security definer set search_path='' as $$
  insert into public.notifications(account_id,recipient_user_id,work_item_id,event_type,title,body,href)
  select target_account,m.user_id,target_work_item,target_event,target_title,target_body,
         case when target_work_item is null then '/business/dashboard'
              else '/business/turnovers/'||target_work_item::text end
  from public.business_members m
  where m.account_id=target_account and m.role='owner'
$$;

create or replace function public.notify_assigned_worker(
  target_work_item uuid,
  target_event text,
  target_title text,
  target_body text
) returns void language sql security definer set search_path='' as $$
  insert into public.notifications(account_id,recipient_user_id,work_item_id,event_type,title,body,href)
  select a.account_id,w.user_id,a.work_item_id,target_event,target_title,target_body,
         '/cleaner/turnovers/'||a.work_item_id::text
  from public.assignments a
  join public.workers w on w.id=a.worker_id
  where a.work_item_id=target_work_item
    and a.status in ('pending','accepted')
    and w.user_id is not null
$$;

create or replace function public.transition_work_item(target_work_item uuid, next_status text)
returns public.work_items language plpgsql security definer set search_path='' as $$
declare
  current_row public.work_items;
  result public.work_items;
  allowed boolean := false;
  owner_actor boolean;
  worker_actor boolean;
begin
  select * into current_row from public.work_items where id=target_work_item for update;
  if current_row.id is null then raise exception 'work_item_not_found'; end if;
  owner_actor := public.is_business_member(current_row.account_id);
  worker_actor := public.is_assigned_worker(current_row.id);
  if not (owner_actor or worker_actor) then raise exception 'forbidden'; end if;

  -- Only the assigned cleaner can accept/decline and perform progress steps.
  if next_status in ('accepted','declined','en_route','arrived','in_progress','evidence_submitted')
     and not worker_actor then raise exception 'assigned_worker_required'; end if;

  allowed := case current_row.status
    when 'awaiting_response' then next_status in ('accepted','declined','cancelled')
    when 'accepted' then next_status in ('en_route','cancelled')
    when 'en_route' then next_status in ('arrived','cancelled')
    when 'arrived' then next_status in ('in_progress','cancelled')
    when 'in_progress' then next_status in ('evidence_submitted','action_required','cancelled')
    when 'evidence_submitted' then next_status in ('action_required','cancelled')
    when 'declined' then next_status in ('unassigned','awaiting_response','cancelled')
    when 'unassigned' then next_status in ('awaiting_response','cancelled')
    when 'action_required' then next_status in ('in_progress','cancelled')
    else false end;
  if not allowed then raise exception 'invalid_status_transition:%->%',current_row.status,next_status; end if;

  if next_status in ('accepted','declined') then
    update public.assignments
       set status=next_status,responded_at=now()
     where work_item_id=target_work_item and status='pending';
  end if;
  if next_status='evidence_submitted' then
    update public.work_items set completion_submitted_at=now() where id=target_work_item;
  end if;

  update public.work_items
     set status=next_status,
         actual_started_at=case when next_status='in_progress' then coalesce(actual_started_at,now()) else actual_started_at end,
         actual_completed_at=case when next_status='evidence_submitted' then now() else actual_completed_at end,
         updated_at=now()
   where id=target_work_item
   returning * into result;

  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description)
  values(result.account_id,result.id,auth.uid(),'turnover_'||next_status,
         'Turnover status changed to '||replace(next_status,'_',' '));

  if next_status in ('accepted','declined','en_route','arrived','evidence_submitted') then
    perform public.notify_account_owners(
      result.account_id,result.id,'turnover_'||next_status,
      case next_status
        when 'accepted' then 'Turnover accepted'
        when 'declined' then 'Turnover declined'
        when 'en_route' then 'Cleaner en route'
        when 'arrived' then 'Cleaner arrived'
        else 'Completion submitted' end,
      'Open the turnover to review the latest update.'
    );
  end if;
  if next_status='evidence_submitted' then
    perform public.evaluate_work_item_readiness(target_work_item);
  end if;
  return result;
end $$;

drop function if exists public.accept_worker_invitation(text);
create or replace function public.accept_worker_invitation(raw_token text, confirmed_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.worker_invitations; worker_name text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(confirmed_name))<2 or char_length(trim(confirmed_name))>120
    then raise exception 'invalid_confirmed_name'; end if;
  select * into invitation from public.worker_invitations
    where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex')
      and accepted_at is null and revoked_at is null and expires_at>now()
    for update;
  if invitation.id is null then raise exception 'invitation_invalid_or_expired'; end if;
  if exists(select 1 from public.workers where user_id=auth.uid() and id<>invitation.worker_id)
    then raise exception 'user_already_linked_to_worker'; end if;
  update public.workers
     set user_id=auth.uid(),display_name=trim(confirmed_name),
         invitation_status='accepted',status='active',updated_at=now()
   where id=invitation.worker_id returning display_name into worker_name;
  update public.worker_invitations set accepted_at=now() where id=invitation.id;
  insert into public.activity_events(account_id,worker_id,actor_user_id,event_type,description)
  values(invitation.account_id,invitation.worker_id,auth.uid(),'cleaner_invitation_accepted',
         worker_name||' accepted the invitation');
  perform public.notify_account_owners(
    invitation.account_id,null,'cleaner_invitation_accepted',
    'Cleaner invitation accepted',worker_name||' can now receive turnover assignments.'
  );
  return invitation.worker_id;
end $$;

create or replace function public.move_checklist_template_task(target_task uuid, move_direction text)
returns void language plpgsql security definer set search_path='' as $$
declare current_task public.checklist_template_tasks; adjacent_task public.checklist_template_tasks;
begin
  select task.* into current_task
  from public.checklist_template_tasks task
  join public.checklist_template_sections section on section.id=task.section_id
  join public.checklist_templates template on template.id=section.template_id
  where task.id=target_task and public.is_business_member(template.account_id)
  for update of task;
  if current_task.id is null then raise exception 'forbidden'; end if;
  if move_direction='up' then
    select * into adjacent_task from public.checklist_template_tasks
    where section_id=current_task.section_id and position<current_task.position
    order by position desc limit 1 for update;
  elsif move_direction='down' then
    select * into adjacent_task from public.checklist_template_tasks
    where section_id=current_task.section_id and position>current_task.position
    order by position asc limit 1 for update;
  else
    raise exception 'invalid_direction';
  end if;
  if adjacent_task.id is null then return; end if;
  update public.checklist_template_tasks set position=-1 where id=current_task.id;
  update public.checklist_template_tasks set position=current_task.position where id=adjacent_task.id;
  update public.checklist_template_tasks set position=adjacent_task.position where id=current_task.id;
end $$;

create or replace function public.assign_work_item_worker(target_work_item uuid, target_worker uuid)
returns public.assignments language plpgsql security definer set search_path='' as $$
declare item public.work_items; worker public.workers; result public.assignments;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null or not public.is_business_member(item.account_id) then raise exception 'forbidden'; end if;
  if item.status in ('ready','cancelled','evidence_submitted') then raise exception 'turnover_not_assignable'; end if;
  select * into worker from public.workers
   where id=target_worker and account_id=item.account_id and status='active';
  if worker.id is null then raise exception 'worker_unavailable'; end if;

  update public.assignments
     set status='cancelled',cancelled_at=now()
   where work_item_id=item.id and status in ('pending','accepted');
  insert into public.assignments(account_id,work_item_id,worker_id,status,assigned_by)
  values(item.account_id,item.id,worker.id,'pending',auth.uid()) returning * into result;
  update public.work_items set status='awaiting_response',updated_at=now() where id=item.id;
  insert into public.activity_events(account_id,work_item_id,worker_id,actor_user_id,event_type,description)
  values(item.account_id,item.id,worker.id,auth.uid(),'cleaner_assigned',
         worker.display_name||' was assigned to the turnover');
  perform public.notify_assigned_worker(
    item.id,'turnover_assigned','New turnover assigned',
    'Review the turnover details and accept or decline the assignment.'
  );
  return result;
end $$;

create or replace function public.cancel_work_item_assignment(target_work_item uuid)
returns void language plpgsql security definer set search_path='' as $$
declare item public.work_items;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null or not public.is_business_member(item.account_id) then raise exception 'forbidden'; end if;
  perform public.notify_assigned_worker(
    item.id,'assignment_cancelled','Assignment cancelled',
    'The operator cancelled your assignment for this turnover.'
  );
  update public.assignments set status='cancelled',cancelled_at=now()
   where work_item_id=item.id and status in ('pending','accepted');
  update public.work_items set status='unassigned',updated_at=now() where id=item.id;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description)
  values(item.account_id,item.id,auth.uid(),'assignment_cancelled','The cleaner assignment was cancelled');
end $$;

create or replace function public.notify_work_item_readiness_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status and new.status='ready' then
    perform public.notify_account_owners(
      new.account_id,new.id,'property_ready','Property ready',
      'All configured readiness requirements have passed.'
    );
    perform public.notify_assigned_worker(
      new.id,'property_ready','Property marked ready',
      'The operator can now review the completed turnover record.'
    );
  elsif new.status is distinct from old.status and new.status='action_required' then
    perform public.notify_account_owners(
      new.account_id,new.id,'action_required','Turnover needs attention',
      'Completion was submitted, but one or more readiness requirements remain outstanding.'
    );
  end if;
  return new;
end $$;
drop trigger if exists work_item_readiness_notifications on public.work_items;
create trigger work_item_readiness_notifications
after update of status on public.work_items
for each row execute function public.notify_work_item_readiness_change();

create or replace function public.notify_issue_created()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform public.notify_account_owners(
    new.account_id,new.work_item_id,'issue_reported',
    case when new.blocking then 'Blocking issue reported' else 'Issue reported' end,
    new.issue_type||': '||left(new.description,180)
  );
  return new;
end $$;
drop trigger if exists operational_issue_notifications on public.operational_issues;
create trigger operational_issue_notifications
after insert on public.operational_issues
for each row execute function public.notify_issue_created();

create or replace function public.clone_property_checklist(source_property uuid, target_property uuid)
returns void language plpgsql security definer set search_path='' as $$
declare source_template public.checklist_templates; target_template uuid; source_section record; target_section uuid;
begin
  if not exists(select 1 from public.properties p where p.id=source_property and public.is_business_member(p.account_id))
     or not exists(select 1 from public.properties p where p.id=target_property and public.is_business_member(p.account_id))
    then raise exception 'forbidden'; end if;
  if (select account_id from public.properties where id=source_property)
     <> (select account_id from public.properties where id=target_property)
    then raise exception 'cross_account_clone_forbidden'; end if;
  select * into source_template from public.checklist_templates
   where property_id=source_property and active order by version desc limit 1;
  if source_template.id is null then return; end if;
  delete from public.checklist_templates where property_id=target_property;
  insert into public.checklist_templates(account_id,property_id,name,service_code,version,active)
  values(source_template.account_id,target_property,source_template.name,source_template.service_code,1,true)
  returning id into target_template;
  for source_section in select * from public.checklist_template_sections where template_id=source_template.id order by position loop
    insert into public.checklist_template_sections(template_id,title,position)
    values(target_template,source_section.title,source_section.position) returning id into target_section;
    insert into public.checklist_template_tasks(section_id,label,description,position,response_type,mandatory,photo_required,note_required,blocking,conditional_follow_up)
    select target_section,label,description,position,response_type,mandatory,photo_required,note_required,blocking,conditional_follow_up
    from public.checklist_template_tasks where section_id=source_section.id;
  end loop;
end $$;

create or replace function public.expire_worker_invitations(target_account uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
  if not public.is_business_member(target_account) and not public.is_quickola_admin()
    then raise exception 'forbidden'; end if;
  update public.workers w set invitation_status='expired',updated_at=now()
   where w.account_id=target_account and w.invitation_status='pending'
     and exists(
       select 1 from public.worker_invitations i
       where i.worker_id=w.id and i.accepted_at is null and i.revoked_at is null and i.expires_at<=now()
     )
     and not exists(
       select 1 from public.worker_invitations i
       where i.worker_id=w.id and i.accepted_at is null and i.revoked_at is null and i.expires_at>now()
     );
  get diagnostics changed = row_count;
  return changed;
end $$;

create or replace function public.evaluate_work_item_readiness(target_work_item uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  item public.work_items;
  missing_tasks integer;
  missing_task_photos integer;
  missing_notes integer;
  failed_blocking_tasks integer;
  evidence_count integer;
  blocking_issues integer;
  key_required boolean;
  key_count integer;
  reasons jsonb := '[]'::jsonb;
  decision boolean;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_business_member(item.account_id) or public.is_assigned_worker(item.id))
    then raise exception 'forbidden'; end if;
  select count(*) into missing_tasks
    from public.checklist_tasks where work_item_id=item.id and mandatory and not completed;
  select count(*) into missing_task_photos
    from public.checklist_tasks t where t.work_item_id=item.id and t.photo_required
      and not exists(select 1 from public.evidence_submissions e where e.checklist_task_id=t.id);
  select count(*) into missing_notes
    from public.checklist_tasks where work_item_id=item.id and note_required and nullif(trim(note),'') is null;
  select count(*) into failed_blocking_tasks
    from public.checklist_tasks where work_item_id=item.id and blocking
      and response_type in ('yes_no','pass_fail') and response in ('no','fail');
  select count(*) into evidence_count
    from public.evidence_submissions where work_item_id=item.id and evidence_type='completion_photo';
  select count(*) into blocking_issues
    from public.operational_issues where work_item_id=item.id and blocking and status not in ('resolved','closed');
  select exists(
    select 1 from public.checklist_tasks
    where work_item_id=item.id and label ilike '%key%return%' and mandatory
  ) into key_required;
  select count(*) into key_count
    from public.evidence_submissions where work_item_id=item.id and evidence_type='key_return';

  if item.completion_submitted_at is null then reasons := reasons || '"Completion has not been submitted"'::jsonb; end if;
  if missing_tasks>0 then reasons := reasons || to_jsonb(missing_tasks||' mandatory checklist task'||case when missing_tasks=1 then ' is' else 's are' end||' incomplete'); end if;
  if missing_task_photos>0 then reasons := reasons || to_jsonb(missing_task_photos||' task photo'||case when missing_task_photos=1 then ' is' else 's are' end||' missing'); end if;
  if missing_notes>0 then reasons := reasons || to_jsonb(missing_notes||' required note'||case when missing_notes=1 then ' is' else 's are' end||' missing'); end if;
  if failed_blocking_tasks>0 then reasons := reasons || to_jsonb(failed_blocking_tasks||' blocking checklist result'||case when failed_blocking_tasks=1 then ' requires' else 's require' end||' attention'); end if;
  if evidence_count<item.required_evidence_count then reasons := reasons || to_jsonb((item.required_evidence_count-evidence_count)||' completion photo'||case when item.required_evidence_count-evidence_count=1 then ' is' else 's are' end||' missing'); end if;
  if key_required and key_count=0 then reasons := reasons || '"Key-return confirmation is missing"'::jsonb; end if;
  if blocking_issues>0 then reasons := reasons || to_jsonb(blocking_issues||' blocking issue'||case when blocking_issues=1 then ' remains' else 's remain' end||' open'); end if;

  decision := jsonb_array_length(reasons)=0;
  update public.work_items set
    readiness_decision=decision,
    readiness_evaluated_at=now(),
    readiness_result=jsonb_build_object(
      'ready',decision,'blocking_reasons',reasons,
      'mandatory_tasks_missing',missing_tasks,
      'task_photos_missing',missing_task_photos,
      'required_notes_missing',missing_notes,
      'failed_blocking_tasks',failed_blocking_tasks,
      'required_photos_missing',greatest(item.required_evidence_count-evidence_count,0),
      'blocking_issues',blocking_issues
    ),
    ready_at=case when decision then coalesce(ready_at,now()) else null end,
    status=case when decision then 'ready'
                when completion_submitted_at is not null then 'action_required'
                else status end,
    updated_at=now()
  where id=item.id;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description,metadata)
  values(item.account_id,item.id,auth.uid(),'readiness_evaluated',
    case when decision then 'Property marked ready'
         else 'Property readiness check found outstanding requirements' end,
    jsonb_build_object('ready',decision,'blocking_reasons',reasons));
  return jsonb_build_object('ready',decision,'blocking_reasons',reasons);
end $$;
