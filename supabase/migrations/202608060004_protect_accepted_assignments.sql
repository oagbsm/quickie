-- An accepted cleaner cannot be removed by resetting the work item.
-- Pending invitations remain cancellable, with their assignment history kept.
create or replace function public.assign_work_item_worker(target_work_item uuid, target_worker uuid)
returns public.assignments language plpgsql security definer set search_path='' as $$
declare
  item public.work_items;
  worker public.workers;
  result public.assignments;
begin
  select * into item from public.work_items where id = target_work_item for update;
  if item.id is null or not public.is_business_member(item.account_id) then raise exception 'forbidden'; end if;
  if item.status not in ('unassigned', 'awaiting_response') then raise exception 'turnover_not_assignable'; end if;
  select * into worker from public.workers where id = target_worker and account_id = item.account_id and status = 'active';
  if worker.id is null then raise exception 'worker_unavailable'; end if;
  update public.assignments set status = 'cancelled', cancelled_at = now()
  where work_item_id = item.id and status = 'pending';
  insert into public.assignments(account_id, work_item_id, worker_id, status, assigned_by)
  values(item.account_id, item.id, worker.id, 'pending', auth.uid()) returning * into result;
  update public.work_items set status = 'awaiting_response', updated_at = now() where id = item.id;
  insert into public.activity_events(account_id, work_item_id, worker_id, actor_user_id, event_type, description)
  values(item.account_id, item.id, worker.id, auth.uid(), 'cleaner_assigned', worker.display_name || ' was assigned to the turnover');
  perform public.notify_assigned_worker(item.id, 'turnover_assigned', 'New turnover assigned', 'Review the turnover details and accept or decline the assignment.');
  return result;
end $$;

create or replace function public.cancel_work_item_assignment(target_work_item uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  item public.work_items;
begin
  select * into item
  from public.work_items
  where id = target_work_item
  for update;

  if item.id is null or not public.is_business_member(item.account_id) then
    raise exception 'forbidden';
  end if;

  if item.status <> 'awaiting_response' then
    raise exception 'assignment_cannot_be_removed_after_acceptance';
  end if;

  perform public.notify_assigned_worker(
    item.id,
    'assignment_cancelled',
    'Assignment cancelled',
    'The operator cancelled your assignment for this turnover.'
  );

  update public.assignments
  set status = 'cancelled', cancelled_at = now()
  where work_item_id = item.id and status = 'pending';

  update public.work_items
  set status = 'unassigned', updated_at = now()
  where id = item.id;

  insert into public.activity_events(account_id, work_item_id, actor_user_id, event_type, description)
  values(item.account_id, item.id, auth.uid(), 'assignment_cancelled', 'The cleaner assignment was cancelled');
end $$;
