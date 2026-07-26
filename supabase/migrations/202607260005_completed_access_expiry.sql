-- Accepted cleaners lose property/access visibility after the work item reaches
-- a terminal state. Owners retain access through account membership.
create or replace function public.is_accepted_worker(target_work_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1
    from public.assignments assignment
    join public.workers worker on worker.id=assignment.worker_id
    join public.business_accounts account on account.id=assignment.account_id
    join public.work_items item on item.id=assignment.work_item_id
    where assignment.work_item_id=target_work_item
      and worker.user_id=auth.uid()
      and assignment.status='accepted'
      and worker.status='active'
      and account.suspended_at is null
      and item.status not in ('ready','cancelled')
  )
$$;
