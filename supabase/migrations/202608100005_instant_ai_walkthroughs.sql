-- Add private, job-independent walkthroughs without manufacturing a clean or property.
alter table public.cleaner_walkthrough_scans
  alter column work_item_id drop not null,
  add column if not exists mode text not null default 'job' check (mode in ('job','instant'));
alter table public.cleaner_walkthrough_issues
  alter column work_item_id drop not null;

create index if not exists cleaner_walkthrough_scans_owner_idx on public.cleaner_walkthrough_scans(cleaner_user_id, created_at desc);

-- Instant scans are owned only by the authenticated user. The existing scan and
-- issue RLS policies continue to scope reads and updates through cleaner_user_id.
create or replace function public.create_instant_cleaner_walkthrough_scan()
returns public.cleaner_walkthrough_scans
language plpgsql security definer set search_path = '' as $$
declare result public.cleaner_walkthrough_scans;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  insert into public.cleaner_walkthrough_scans(cleaner_user_id, mode, work_item_id, account_id, status)
  values (auth.uid(), 'instant', null, null, 'uploading')
  returning * into result;
  return result;
end; $$;
revoke all on function public.create_instant_cleaner_walkthrough_scan() from public, anon;
grant execute on function public.create_instant_cleaner_walkthrough_scan() to authenticated;

drop policy if exists "walkthrough cleaners add own issues" on public.cleaner_walkthrough_issues;
create policy "walkthrough cleaners add own issues" on public.cleaner_walkthrough_issues for insert to authenticated with check (
  exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = scan_id and scan.cleaner_user_id = auth.uid() and scan.work_item_id is not distinct from work_item_id)
);

-- The source path is still private and readable only by the owning cleaner,
-- authorised job participants, or members of the associated business account.
