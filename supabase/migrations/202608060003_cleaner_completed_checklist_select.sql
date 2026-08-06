-- Preserve checklist history for the cleaner who performed a completed clean.
-- Active checklist access remains governed by the accepted-worker policy.
drop policy if exists "workers view completed assigned checklist tasks" on public.checklist_tasks;
create policy "workers view completed assigned checklist tasks"
on public.checklist_tasks for select to authenticated
using (
  public.is_assigned_worker(work_item_id)
  and exists (
    select 1
    from public.work_items item
    where item.id = checklist_tasks.work_item_id
      and item.status = 'ready'
  )
  and exists (
    select 1
    from public.assignments assignment
    join public.workers worker on worker.id = assignment.worker_id
    where assignment.work_item_id = checklist_tasks.work_item_id
      and assignment.status = 'accepted'
      and worker.user_id = auth.uid()
      and worker.status = 'active'
  )
);
