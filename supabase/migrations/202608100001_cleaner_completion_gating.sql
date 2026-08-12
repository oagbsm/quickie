-- Authoritative completion gate for cleaner execution. This is evaluated from
-- persisted rows immediately before the terminal submission transition.
create or replace function public.cleaner_completion_requirements(target_work_item uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.work_items;
  missing_tasks integer;
  missing_task_photos integer;
  evidence_count integer;
  remaining_photos integer;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_assigned_worker(item.id) or item.standalone_cleaner_user_id = auth.uid()) then raise exception 'forbidden'; end if;

  select count(*) into missing_tasks
  from public.checklist_tasks as task
  where task.work_item_id = item.id
    and task.mandatory
    and not task.completed;

  select count(*) into missing_task_photos
  from public.checklist_tasks as task
  where task.work_item_id = item.id
    and (task.photo_required or task.label ilike '%key%return%')
    and not exists (
      select 1
      from public.evidence_submissions as evidence
      where evidence.work_item_id = item.id
        and evidence.checklist_task_id = task.id
        and nullif(trim(evidence.storage_path), '') is not null
    );

  select count(*) into evidence_count
  from public.evidence_submissions as evidence
  where evidence.work_item_id = item.id
    and evidence.evidence_type = 'completion_photo'
    and nullif(trim(evidence.storage_path), '') is not null;

  remaining_photos := greatest(coalesce(item.required_evidence_count, 0) - evidence_count, 0);
  return jsonb_build_object(
    'code', case when missing_tasks = 0 and missing_task_photos = 0 and remaining_photos = 0 then 'ready' else 'completion_requirements_missing' end,
    'remaining_tasks', missing_tasks,
    'remaining_task_photos', missing_task_photos,
    'remaining_photos', remaining_photos
  );
end;
$$;
revoke all on function public.cleaner_completion_requirements(uuid) from public, anon;
grant execute on function public.cleaner_completion_requirements(uuid) to authenticated;

create or replace function public.transition_work_item(target_work_item uuid, next_status text)
returns public.work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.work_items;
  result public.work_items;
  allowed boolean := false;
  owner_actor boolean;
  worker_actor boolean;
  standalone_actor boolean;
  requirements jsonb;
begin
  select * into current_row from public.work_items where id = target_work_item for update;
  if current_row.id is null then raise exception 'work_item_not_found'; end if;
  owner_actor := public.is_business_member(current_row.account_id);
  worker_actor := public.is_assigned_worker(current_row.id);
  standalone_actor := current_row.standalone_cleaner_user_id = auth.uid();
  if not (owner_actor or worker_actor or standalone_actor) then raise exception 'forbidden'; end if;
  if current_row.status = next_status then return current_row; end if;
  if next_status in ('accepted','declined','en_route','arrived','in_progress','evidence_submitted') and not (worker_actor or standalone_actor) then raise exception 'assigned_worker_required'; end if;
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
    else false
  end;
  if not allowed then raise exception 'invalid_status_transition:%->%', current_row.status, next_status; end if;

  if next_status = 'evidence_submitted' then
    requirements := public.cleaner_completion_requirements(target_work_item);
    if requirements->>'code' <> 'ready' then
      raise exception 'completion_requirements_missing' using detail = requirements::text;
    end if;
  end if;
  if next_status in ('accepted','declined') then
    update public.assignments set status = next_status, responded_at = now()
    where work_item_id = target_work_item and status = 'pending';
  end if;
  if next_status = 'evidence_submitted' then
    update public.work_items set completion_submitted_at = now() where id = target_work_item;
  end if;
  update public.work_items
  set status = next_status,
      actual_started_at = case when next_status = 'in_progress' then coalesce(actual_started_at, now()) else actual_started_at end,
      actual_completed_at = case when next_status = 'evidence_submitted' then now() else actual_completed_at end,
      updated_at = now()
  where id = target_work_item
  returning * into result;
  insert into public.activity_events(account_id, work_item_id, actor_user_id, event_type, description)
  values (result.account_id, result.id, auth.uid(), 'turnover_' || next_status, 'Turnover status changed to ' || replace(next_status, '_', ' '));
  if next_status = 'evidence_submitted' then perform public.evaluate_work_item_readiness(target_work_item); end if;
  return result;
end;
$$;
revoke all on function public.transition_work_item(uuid,text) from public, anon;
grant execute on function public.transition_work_item(uuid,text) to authenticated;
