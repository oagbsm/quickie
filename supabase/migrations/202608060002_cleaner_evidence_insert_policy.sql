-- Keep cleaner evidence inserts narrowly scoped to the authenticated worker,
-- the assigned work item, its account, and (when present) its task instance.
drop policy if exists "workers add accepted evidence" on public.evidence_submissions;
drop policy if exists "workers add assigned evidence" on public.evidence_submissions;
create policy "workers add assigned evidence"
on public.evidence_submissions for insert to authenticated
with check (
  uploader_id = auth.uid()
  and evidence_type in ('completion_photo', 'key_return')
  and exists (
    select 1
    from public.work_items item
    join public.assignments assignment
      on assignment.work_item_id = item.id
    join public.workers worker
      on worker.id = assignment.worker_id
    where item.id = evidence_submissions.work_item_id
      and item.account_id = evidence_submissions.account_id
      and assignment.account_id = item.account_id
      and assignment.status in ('pending', 'accepted')
      and assignment.worker_id = worker.id
      and worker.user_id = auth.uid()
      and worker.status = 'active'
      and item.status in ('in_progress', 'action_required')
      and item.account_id is not null
  )
  and (
    evidence_submissions.checklist_task_id is null
    or exists (
      select 1
      from public.checklist_tasks task
      where task.id = evidence_submissions.checklist_task_id
        and task.work_item_id = evidence_submissions.work_item_id
        and task.account_id = evidence_submissions.account_id
    )
  )
  and (
    (evidence_submissions.checklist_task_id is null and evidence_submissions.evidence_type = 'completion_photo')
    or (evidence_submissions.checklist_task_id is not null and evidence_submissions.evidence_type in ('completion_photo', 'key_return'))
  )
);
