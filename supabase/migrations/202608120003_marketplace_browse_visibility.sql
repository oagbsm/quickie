-- Authenticated marketplace users can browse open jobs from other accounts.
-- Drafts and closed jobs remain private/non-browseable.
drop policy if exists "marketplace users browse open jobs" on public.marketplace_jobs;
create policy "marketplace users browse open jobs"
on public.marketplace_jobs for select to authenticated
using (status in ('posted', 'finding_provider'));
