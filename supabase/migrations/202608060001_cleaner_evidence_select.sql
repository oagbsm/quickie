-- Assigned cleaners must be able to read the evidence they upload so the
-- persisted task association can be rendered and verified after insertion.
drop policy if exists "workers view assigned evidence" on public.evidence_submissions;
create policy "workers view assigned evidence"
on public.evidence_submissions for select to authenticated
using (public.is_assigned_worker(work_item_id));
