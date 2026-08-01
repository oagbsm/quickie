-- Pass 3: keep readiness server-authoritative for every required checklist result.
create or replace function public.evaluate_work_item_readiness(target_work_item uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item public.work_items; missing_tasks integer; missing_task_photos integer; missing_notes integer; missing_results integer; failed_blocking_tasks integer; evidence_count integer; blocking_issues integer; key_required boolean; key_count integer; reasons jsonb := '[]'::jsonb; decision boolean;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_business_member(item.account_id) or public.is_assigned_worker(item.id)) then raise exception 'forbidden'; end if;
  select count(*) into missing_tasks from public.checklist_tasks where work_item_id=item.id and mandatory and not completed;
  select count(*) into missing_task_photos from public.checklist_tasks t where t.work_item_id=item.id and t.photo_required and not exists(select 1 from public.evidence_submissions e where e.checklist_task_id=t.id and nullif(trim(e.storage_path),'') is not null);
  select count(*) into missing_notes from public.checklist_tasks where work_item_id=item.id and note_required and nullif(trim(note),'') is null;
  select count(*) into missing_results from public.checklist_tasks where work_item_id=item.id and mandatory and completed and response_type <> 'checkbox' and (response is null or (response_type='yes_no' and response not in ('yes','no')) or (response_type='pass_fail' and response not in ('pass','fail')));
  select count(*) into failed_blocking_tasks from public.checklist_tasks where work_item_id=item.id and blocking and response_type in ('yes_no','pass_fail') and response in ('no','fail');
  select count(*) into evidence_count from public.evidence_submissions where work_item_id=item.id and evidence_type='completion_photo' and nullif(trim(storage_path),'') is not null;
  select count(*) into blocking_issues from public.operational_issues where work_item_id=item.id and blocking and status not in ('resolved','closed');
  select exists(select 1 from public.checklist_tasks where work_item_id=item.id and label ilike '%key%return%' and mandatory) into key_required;
  select count(*) into key_count from public.evidence_submissions where work_item_id=item.id and evidence_type='key_return' and nullif(trim(storage_path),'') is not null;
  if item.completion_submitted_at is null then reasons := reasons || '"Completion has not been submitted"'::jsonb; end if;
  if missing_tasks>0 then reasons := reasons || to_jsonb(missing_tasks||' mandatory checklist task(s) incomplete'); end if;
  if missing_results>0 then reasons := reasons || to_jsonb(missing_results||' required checklist result(s) missing'); end if;
  if missing_task_photos>0 then reasons := reasons || to_jsonb(missing_task_photos||' task photo(s) missing'); end if;
  if missing_notes>0 then reasons := reasons || to_jsonb(missing_notes||' required note(s) missing'); end if;
  if failed_blocking_tasks>0 then reasons := reasons || to_jsonb(failed_blocking_tasks||' blocking checklist result(s) require attention'); end if;
  if evidence_count<item.required_evidence_count then reasons := reasons || to_jsonb((item.required_evidence_count-evidence_count)||' completion photo(s) missing'); end if;
  if key_required and key_count=0 then reasons := reasons || '"Key-return confirmation is missing"'::jsonb; end if;
  if blocking_issues>0 then reasons := reasons || to_jsonb(blocking_issues||' blocking issue(s) remain open'); end if;
  decision := jsonb_array_length(reasons)=0;
  update public.work_items set readiness_decision=decision, readiness_evaluated_at=now(), readiness_result=jsonb_build_object('ready',decision,'blocking_reasons',reasons,'mandatory_tasks_missing',missing_tasks,'required_results_missing',missing_results,'task_photos_missing',missing_task_photos,'required_notes_missing',missing_notes,'failed_blocking_tasks',failed_blocking_tasks,'required_photos_missing',greatest(item.required_evidence_count-evidence_count,0),'blocking_issues',blocking_issues), ready_at=case when decision then coalesce(ready_at,now()) else null end, status=case when decision then 'ready' when completion_submitted_at is not null then 'action_required' else status end, updated_at=now() where id=item.id;
  return jsonb_build_object('ready',decision,'blocking_reasons',reasons);
end $$;
