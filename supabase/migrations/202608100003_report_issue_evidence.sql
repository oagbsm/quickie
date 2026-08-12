-- Include issue evidence in the canonical report without adding private fields.
create or replace function public.create_work_item_completion_report(target_work_item uuid)
returns public.work_item_completion_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.work_items;
  property_row public.properties;
  result public.work_item_completion_reports;
  owner uuid;
  payload jsonb;
  reference text;
begin
  select * into item from public.work_items where id = target_work_item;
  owner := coalesce(item.standalone_cleaner_user_id, auth.uid());
  if item.id is null or not (item.standalone_cleaner_user_id = auth.uid() or public.is_assigned_worker(item.id)) then raise exception 'forbidden'; end if;
  if item.status <> 'ready' then raise exception 'clean_not_completed'; end if;
  select * into property_row from public.properties where id = item.property_id;
  reference := 'QK-' || upper(substr(replace(item.id::text, '-', ''), 1, 10));
  select jsonb_build_object(
    'reference', reference,
    'property_name', property_row.nickname,
    'address', concat_ws(', ', property_row.address_line_1, property_row.city, property_row.postcode),
    'bedrooms', property_row.bedrooms,
    'bathrooms', property_row.bathrooms,
    'cleaning_date', item.turnover_date,
    'cleaning_start', item.access_start_at,
    'cleaning_end', item.window_end_at,
    'guest_checkin', item.next_checkin_at,
    'cleaner_name', coalesce((select profile.display_name from public.cleaner_profiles as profile where profile.user_id = owner), (select worker.display_name from public.workers as worker where worker.user_id = owner)),
    'completed_at', coalesce(item.ready_at, item.actual_completed_at),
    'checklist', (select coalesce(jsonb_agg(to_jsonb(task) order by task.position), '[]'::jsonb) from public.checklist_tasks as task where task.work_item_id = item.id),
    'evidence', (select coalesce(jsonb_agg(jsonb_build_object('id', evidence.id, 'type', evidence.evidence_type, 'task_id', evidence.checklist_task_id, 'issue_id', evidence.issue_id, 'storage_path', evidence.storage_path) order by evidence.created_at), '[]'::jsonb) from public.evidence_submissions as evidence where evidence.work_item_id = item.id),
    'issues', (select coalesce(jsonb_agg(jsonb_build_object('id', issue.id, 'title', issue.issue_type, 'description', issue.description, 'severity', issue.severity, 'status', issue.status) order by issue.created_at), '[]'::jsonb) from public.operational_issues as issue where issue.work_item_id = item.id)
  ) into payload;
  insert into public.work_item_completion_reports(work_item_id, account_id, cleaner_user_id, report_reference, report_data)
  values (item.id, item.account_id, owner, reference, payload)
  on conflict (work_item_id) do update set report_data = excluded.report_data, updated_at = now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.create_work_item_completion_report(uuid) from public, anon;
grant execute on function public.create_work_item_completion_report(uuid) to authenticated;
