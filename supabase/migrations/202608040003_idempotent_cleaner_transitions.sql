-- Cleaner workflow transitions are safe to retry after a lost response or refresh.
-- A repeated request for the already-current state returns the canonical row
-- without creating a second activity event or notification.
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

  if next_status in ('accepted','declined','en_route','arrived','in_progress','evidence_submitted')
     and not worker_actor then raise exception 'assigned_worker_required'; end if;

  -- The same cleaner request may be retried after the browser loses the
  -- response. Return the current state without duplicating side effects.
  if current_row.status = next_status then
    return current_row;
  end if;

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
  if next_status='evidence_submitted' then perform public.evaluate_work_item_readiness(target_work_item); end if;
  return result;
end $$;
