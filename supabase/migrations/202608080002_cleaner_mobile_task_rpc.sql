-- Keep cleaner checklist updates server-authoritative for mobile clients.
-- The existing web action performs these checks before its table update; this
-- RPC exposes the same narrow operation without weakening checklist RLS.
create or replace function public.cleaner_update_checklist_task(
  target_task uuid,
  target_work_item uuid,
  next_response text,
  next_note text
)
returns public.checklist_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.work_items;
  task public.checklist_tasks;
  result public.checklist_tasks;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not public.is_assigned_worker(item.id) then raise exception 'forbidden'; end if;
  if item.status not in ('in_progress','action_required') then raise exception 'checklist_not_active'; end if;

  select * into task from public.checklist_tasks
    where id = target_task and work_item_id = target_work_item;
  if task.id is null then raise exception 'checklist_task_not_found'; end if;
  if task.note_required and nullif(trim(coalesce(next_note,'')),'') is null then raise exception 'task_note_required'; end if;
  if task.response_type = 'yes_no' and coalesce(next_response,'') not in ('yes','no') then raise exception 'task_response_required'; end if;
  if task.response_type = 'pass_fail' and coalesce(next_response,'') not in ('pass','fail') then raise exception 'task_response_required'; end if;
  if (task.photo_required or task.label ilike '%key%return%') and not exists (
    select 1 from public.evidence_submissions e
    where e.work_item_id = target_work_item and e.checklist_task_id = target_task
      and nullif(trim(e.storage_path),'') is not null
  ) then raise exception 'task_photo_required'; end if;

  update public.checklist_tasks set
    completed = true,
    response = next_response,
    note = nullif(trim(coalesce(next_note,'')),''),
    completed_by = auth.uid(),
    completed_at = now()
  where id = target_task and work_item_id = target_work_item
  returning * into result;

  perform public.evaluate_work_item_readiness(target_work_item);
  return result;
end $$;

revoke all on function public.cleaner_update_checklist_task(uuid,uuid,text,text) from public;
grant execute on function public.cleaner_update_checklist_task(uuid,uuid,text,text) to authenticated;
