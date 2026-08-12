-- AI walkthroughs are assistive evidence, not a cleanliness certification.
create table if not exists public.cleaner_walkthrough_scans (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  account_id uuid references public.business_accounts(id) on delete cascade,
  cleaner_user_id uuid not null references auth.users(id) on delete cascade,
  source_storage_path text,
  status text not null default 'uploading' check (status in ('recording','uploading','processing','review_required','resolved','completed','failed')),
  frame_count integer not null default 0 check (frame_count >= 0 and frame_count <= 25),
  issue_count integer not null default 0 check (issue_count >= 0),
  resolved_issue_count integer not null default 0 check (resolved_issue_count >= 0),
  provider text,
  model text,
  error_message text,
  scan_version integer not null default 1,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists cleaner_walkthrough_scans_work_item_idx on public.cleaner_walkthrough_scans(work_item_id, created_at desc);

create table if not exists public.cleaner_walkthrough_issues (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.cleaner_walkthrough_scans(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  frame_index integer not null check (frame_index >= 0 and frame_index < 25),
  frame_storage_path text,
  category text not null check (category in ('rubbish','bins','dishes','clutter','bed_presentation','linen','cleaning_equipment','stain_or_mess')),
  confidence text not null check (confidence in ('low','medium','high')),
  description text not null check (char_length(description) between 1 and 500),
  resolution_status text not null default 'unresolved' check (resolution_status in ('unresolved','fixed','not_an_issue')),
  resolution_note text,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cleaner_walkthrough_issues_scan_idx on public.cleaner_walkthrough_issues(scan_id);

alter table public.cleaner_walkthrough_scans enable row level security;
alter table public.cleaner_walkthrough_issues enable row level security;

create policy "walkthrough cleaners view authorised scans" on public.cleaner_walkthrough_scans for select to authenticated using (
  cleaner_user_id = auth.uid() or public.is_assigned_worker(work_item_id) or (account_id is not null and public.is_business_member(account_id))
);
create policy "walkthrough cleaners view authorised issues" on public.cleaner_walkthrough_issues for select to authenticated using (
  exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = scan_id and (scan.cleaner_user_id = auth.uid() or public.is_assigned_worker(scan.work_item_id) or (scan.account_id is not null and public.is_business_member(scan.account_id))))
);
create policy "walkthrough cleaners update own scans" on public.cleaner_walkthrough_scans for update to authenticated using (cleaner_user_id = auth.uid()) with check (cleaner_user_id = auth.uid());
create policy "walkthrough cleaners update own issues" on public.cleaner_walkthrough_issues for update to authenticated using (exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = scan_id and scan.cleaner_user_id = auth.uid())) with check (exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = scan_id and scan.cleaner_user_id = auth.uid()));
create policy "walkthrough cleaners add own issues" on public.cleaner_walkthrough_issues for insert to authenticated with check (exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = scan_id and scan.cleaner_user_id = auth.uid() and scan.work_item_id = work_item_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cleaner-walkthroughs', 'cleaner-walkthroughs', false, 104857600, array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 104857600, allowed_mime_types = excluded.allowed_mime_types;
create policy "walkthrough cleaners upload own files" on storage.objects for insert to authenticated with check (
  bucket_id = 'cleaner-walkthroughs' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "walkthrough authorised users read files" on storage.objects for select to authenticated using (
  bucket_id = 'cleaner-walkthroughs' and (
    (storage.foldername(name))[1] = auth.uid()::text or
    exists (select 1 from public.cleaner_walkthrough_scans scan where scan.source_storage_path = name and (scan.cleaner_user_id = auth.uid() or public.is_assigned_worker(scan.work_item_id) or (scan.account_id is not null and public.is_business_member(scan.account_id))))
  )
);

create or replace function public.create_cleaner_walkthrough_scan(target_work_item uuid, source_path text)
returns public.cleaner_walkthrough_scans
language plpgsql security definer set search_path = '' as $$
declare item public.work_items; result public.cleaner_walkthrough_scans;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null or not (public.is_assigned_worker(item.id) or item.standalone_cleaner_user_id = auth.uid()) then raise exception 'forbidden'; end if;
  select * into result from public.cleaner_walkthrough_scans where work_item_id = target_work_item and cleaner_user_id = auth.uid() and source_storage_path = source_path limit 1;
  if result.id is not null then return result; end if;
  insert into public.cleaner_walkthrough_scans(work_item_id, account_id, cleaner_user_id, source_storage_path, status)
  values (item.id, item.account_id, auth.uid(), source_path, 'processing') returning * into result;
  return result;
end; $$;
revoke all on function public.create_cleaner_walkthrough_scan(uuid,text) from public, anon;
grant execute on function public.create_cleaner_walkthrough_scan(uuid,text) to authenticated;

create or replace function public.resolve_cleaner_walkthrough_issue(target_issue uuid, next_resolution text, note text default null)
returns public.cleaner_walkthrough_issues
language plpgsql security definer set search_path = '' as $$
declare result public.cleaner_walkthrough_issues; total integer; resolved integer;
begin
  if next_resolution not in ('fixed','not_an_issue') then raise exception 'invalid_resolution'; end if;
  update public.cleaner_walkthrough_issues issue set resolution_status = next_resolution, resolution_note = nullif(trim(note), ''), resolved_by = auth.uid(), resolved_at = now()
  where issue.id = target_issue and exists (select 1 from public.cleaner_walkthrough_scans scan where scan.id = issue.scan_id and scan.cleaner_user_id = auth.uid()) returning issue.* into result;
  if result.id is null then raise exception 'forbidden'; end if;
  select count(*), count(*) filter (where resolution_status in ('fixed','not_an_issue')) into total, resolved from public.cleaner_walkthrough_issues where scan_id = result.scan_id;
  update public.cleaner_walkthrough_scans set resolved_issue_count = resolved, status = case when total = resolved then 'completed' else 'review_required' end, completed_at = case when total = resolved then now() else completed_at end where id = result.scan_id;
  return result;
end; $$;
revoke all on function public.resolve_cleaner_walkthrough_issue(uuid,text,text) from public, anon;
grant execute on function public.resolve_cleaner_walkthrough_issue(uuid,text,text) to authenticated;

-- Keep reports useful without exposing private storage URLs.
create or replace function public.create_work_item_completion_report(target_work_item uuid)
returns public.work_item_completion_reports
language plpgsql security definer set search_path = '' as $$
declare item public.work_items; property_row public.properties; result public.work_item_completion_reports; owner uuid; payload jsonb; reference text;
begin
  select * into item from public.work_items where id = target_work_item; owner := coalesce(item.standalone_cleaner_user_id, auth.uid());
  if item.id is null or not (item.standalone_cleaner_user_id = auth.uid() or public.is_assigned_worker(item.id)) or item.status <> 'ready' then raise exception 'forbidden'; end if;
  select * into property_row from public.properties where id = item.property_id; reference := 'QK-' || upper(substr(replace(item.id::text, '-', ''), 1, 10));
  select jsonb_build_object('reference', reference, 'property_name', property_row.nickname, 'address', concat_ws(', ', property_row.address_line_1, property_row.city, property_row.postcode), 'bedrooms', property_row.bedrooms, 'bathrooms', property_row.bathrooms, 'cleaning_date', item.turnover_date, 'cleaning_start', item.access_start_at, 'cleaning_end', item.window_end_at, 'guest_checkin', item.next_checkin_at, 'cleaner_name', coalesce((select profile.display_name from public.cleaner_profiles profile where profile.user_id = owner), (select worker.display_name from public.workers worker where worker.user_id = owner)), 'completed_at', coalesce(item.ready_at, item.actual_completed_at), 'checklist', (select coalesce(jsonb_agg(to_jsonb(task) order by task.position), '[]'::jsonb) from public.checklist_tasks task where task.work_item_id = item.id), 'evidence', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'type', e.evidence_type, 'task_id', e.checklist_task_id, 'issue_id', e.issue_id, 'storage_path', e.storage_path) order by e.created_at), '[]'::jsonb) from public.evidence_submissions e where e.work_item_id = item.id), 'issues', (select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'title', i.issue_type, 'description', i.description, 'severity', i.severity, 'status', i.status) order by i.created_at), '[]'::jsonb) from public.operational_issues i where i.work_item_id = item.id), 'ai_walkthrough', (select jsonb_build_object('status', scan.status, 'frames_checked', scan.frame_count, 'potential_issues', scan.issue_count, 'resolved_issues', scan.resolved_issue_count, 'completed_at', scan.completed_at) from public.cleaner_walkthrough_scans scan where scan.work_item_id = item.id order by scan.created_at desc limit 1)) into payload;
  insert into public.work_item_completion_reports(work_item_id, account_id, cleaner_user_id, report_reference, report_data) values (item.id, item.account_id, owner, reference, payload) on conflict (work_item_id) do update set report_data = excluded.report_data, updated_at = now() returning * into result;
  return result;
end; $$;
revoke all on function public.create_work_item_completion_report(uuid) from public, anon;
grant execute on function public.create_work_item_completion_report(uuid) to authenticated;
