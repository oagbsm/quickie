-- Owners must be able to instantiate and maintain checklist tasks for work
-- items in their own account. Cleaner mutation remains update-only and accepted.
drop policy if exists "members view checklist tasks" on public.checklist_tasks;
drop policy if exists "members manage checklist tasks" on public.checklist_tasks;
create policy "members manage checklist tasks"
on public.checklist_tasks for all to authenticated
using(public.is_business_member(account_id))
with check(public.is_business_member(account_id));
