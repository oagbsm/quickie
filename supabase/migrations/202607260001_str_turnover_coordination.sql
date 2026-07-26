-- Quickola STR turnover coordination V1.
-- Additive migration: legacy managed-service tables remain readable during rollout.
-- New product code uses neutral work_items/workers/checklist objects so future
-- Quickola verticals can share the operational core.

alter table public.business_accounts
  add column if not exists onboarding_step text not null default 'property',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists suspended_at timestamptz;

alter table public.properties
  add column if not exists default_checkout_time time not null default '11:00',
  add column if not exists default_checkin_time time not null default '15:00',
  add column if not exists estimated_turnover_minutes integer not null default 180 check (estimated_turnover_minutes between 15 and 1440),
  add column if not exists image_path text,
  add column if not exists floor_lift_notes text,
  add column if not exists bed_configuration text,
  add column if not exists sofa_bed_required boolean not null default false,
  add column if not exists towel_requirements text,
  add column if not exists consumables_instructions text,
  add column if not exists waste_instructions text,
  add column if not exists heating_instructions text,
  add column if not exists lighting_instructions text,
  add column if not exists emergency_contact text,
  add column if not exists internal_notes text,
  add column if not exists key_return_instructions text,
  add column if not exists required_completion_photos integer not null default 4 check (required_completion_photos between 0 and 50);

alter table public.properties drop constraint if exists properties_property_type_check;
alter table public.properties add constraint properties_property_type_check
  check (property_type in ('house','flat','serviced_apartment','cottage','airbnb','office','shop','communal_area','other'));

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  company_name text,
  email text,
  mobile text,
  preferred_contact_method text not null check (preferred_contact_method in ('email','mobile')),
  invitation_status text not null default 'not_invited'
    check (invitation_status in ('not_invited','pending','accepted','expired','revoked','inactive')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_contact_required check (nullif(trim(email),'') is not null or nullif(trim(mobile),'') is not null),
  unique(account_id, email),
  unique(account_id, mobile)
);

create table if not exists public.worker_invitations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.property_workers (
  property_id uuid not null references public.properties(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(property_id, worker_id)
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  name text not null,
  service_code text not null default 'str_turnover',
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  title text not null,
  position integer not null,
  unique(template_id, position)
);

create table if not exists public.checklist_template_tasks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.checklist_template_sections(id) on delete cascade,
  label text not null,
  description text,
  position integer not null,
  response_type text not null default 'checkbox' check (response_type in ('checkbox','yes_no','pass_fail')),
  mandatory boolean not null default true,
  photo_required boolean not null default false,
  note_required boolean not null default false,
  blocking boolean not null default false,
  conditional_follow_up jsonb not null default '{}'::jsonb,
  unique(section_id, position)
);

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  property_public_name text not null,
  property_general_area text not null,
  service_code text not null default 'str_turnover',
  status text not null default 'unassigned'
    check (status in ('draft','unassigned','awaiting_response','accepted','en_route','arrived','in_progress','evidence_submitted','action_required','ready','declined','cancelled')),
  cleaning_type text not null default 'standard_turnover'
    check (cleaning_type in ('standard_turnover','deep_turnover','mid_stay','custom')),
  turnover_date date not null,
  guest_checkout_at timestamptz not null,
  access_start_at timestamptz not null,
  next_checkin_at timestamptz not null,
  estimated_duration_minutes integer not null check (estimated_duration_minutes between 15 and 1440),
  actual_started_at timestamptz,
  actual_completed_at timestamptz,
  notes text,
  linen_requirement text,
  required_evidence_count integer not null default 0 check (required_evidence_count between 0 and 50),
  risk_acknowledged boolean not null default false,
  completion_submitted_at timestamptz,
  readiness_decision boolean not null default false,
  readiness_evaluated_at timestamptz,
  ready_at timestamptz,
  readiness_result jsonb not null default '{"ready":false,"blocking_reasons":["Completion has not been submitted"]}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turnover_schedule_order check (guest_checkout_at <= access_start_at and access_start_at < next_checkin_at)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now(),
  responded_at timestamptz,
  cancelled_at timestamptz
);
create unique index if not exists assignments_one_current_idx
  on public.assignments(work_item_id) where status in ('pending','accepted');

create table if not exists public.checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  source_task_id uuid references public.checklist_template_tasks(id) on delete set null,
  section_title text not null,
  label text not null,
  description text,
  position integer not null,
  response_type text not null default 'checkbox' check (response_type in ('checkbox','yes_no','pass_fail')),
  mandatory boolean not null default true,
  photo_required boolean not null default false,
  note_required boolean not null default false,
  blocking boolean not null default false,
  completed boolean not null default false,
  response text,
  note text,
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  unique(work_item_id, position)
);

create table if not exists public.evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  checklist_task_id uuid references public.checklist_tasks(id) on delete cascade,
  uploader_id uuid not null references auth.users(id),
  storage_path text not null unique,
  evidence_type text not null check (evidence_type in ('completion_photo','issue_photo','initial_condition','note','key_return')),
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.operational_issues (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  issue_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  description text not null,
  status text not null default 'open' check (status in ('open','acknowledged','waiting_for_owner','resolved','closed')),
  blocking boolean not null default false,
  created_by uuid not null references auth.users(id),
  owner_response text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  work_item_id uuid references public.work_items(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists work_items_account_schedule_idx on public.work_items(account_id, access_start_at);
create index if not exists work_items_property_history_idx on public.work_items(property_id, turnover_date desc);
create index if not exists work_items_status_idx on public.work_items(account_id, status);
create index if not exists workers_account_status_idx on public.workers(account_id, status);
create index if not exists issues_open_idx on public.operational_issues(account_id, status) where status in ('open','acknowledged','waiting_for_owner');
create index if not exists activity_account_time_idx on public.activity_events(account_id, created_at desc);
create index if not exists evidence_work_item_idx on public.evidence_submissions(work_item_id, created_at);

alter table public.workers enable row level security;
alter table public.worker_invitations enable row level security;
alter table public.property_workers enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_sections enable row level security;
alter table public.checklist_template_tasks enable row level security;
alter table public.work_items enable row level security;
alter table public.assignments enable row level security;
alter table public.checklist_tasks enable row level security;
alter table public.evidence_submissions enable row level security;
alter table public.operational_issues enable row level security;
alter table public.activity_events enable row level security;

create or replace function public.is_assigned_worker(target_work_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.assignments a
    join public.workers w on w.id=a.worker_id
    where a.work_item_id=target_work_item and w.user_id=auth.uid()
      and a.status in ('pending','accepted')
  )
$$;

create policy "members manage workers" on public.workers for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "workers view own profile" on public.workers for select to authenticated using (user_id=auth.uid());
create policy "members manage invitations" on public.worker_invitations for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage property workers" on public.property_workers for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage checklist templates" on public.checklist_templates for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "members manage template sections" on public.checklist_template_sections for all to authenticated
  using (exists(select 1 from public.checklist_templates t where t.id=template_id and public.is_business_member(t.account_id)));
create policy "members manage template tasks" on public.checklist_template_tasks for all to authenticated
  using (exists(select 1 from public.checklist_template_sections s join public.checklist_templates t on t.id=s.template_id where s.id=section_id and public.is_business_member(t.account_id)));
create policy "members manage work items" on public.work_items for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "assigned workers view work items" on public.work_items for select to authenticated using (public.is_assigned_worker(id));
create policy "members manage assignments" on public.assignments for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "workers view own assignments" on public.assignments for select to authenticated
  using (exists(select 1 from public.workers w where w.id=worker_id and w.user_id=auth.uid()));
create policy "members view checklist tasks" on public.checklist_tasks for select to authenticated using (public.is_business_member(account_id));
create policy "workers manage assigned checklist tasks" on public.checklist_tasks for all to authenticated
  using (public.is_assigned_worker(work_item_id)) with check (public.is_assigned_worker(work_item_id));
create policy "members view evidence" on public.evidence_submissions for select to authenticated using (public.is_business_member(account_id));
create policy "workers add assigned evidence" on public.evidence_submissions for insert to authenticated
  with check (uploader_id=auth.uid() and public.is_assigned_worker(work_item_id));
create policy "members manage issues" on public.operational_issues for all to authenticated
  using (public.is_business_member(account_id)) with check (public.is_business_member(account_id));
create policy "workers manage assigned issues" on public.operational_issues for all to authenticated
  using (public.is_assigned_worker(work_item_id)) with check (created_by=auth.uid() and public.is_assigned_worker(work_item_id));
create policy "members view activity" on public.activity_events for select to authenticated using (public.is_business_member(account_id));
create policy "workers view assigned activity" on public.activity_events for select to authenticated
  using (work_item_id is not null and public.is_assigned_worker(work_item_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('turnover-evidence','turnover-evidence',false,10485760,array['image/jpeg','image/png','image/webp','image/heic'])
on conflict(id) do update set public=false;

create policy "members read turnover evidence" on storage.objects for select to authenticated
using(bucket_id='turnover-evidence' and public.is_business_member(((storage.foldername(name))[1])::uuid));
create policy "assigned workers upload turnover evidence" on storage.objects for insert to authenticated
with check(
  bucket_id='turnover-evidence' and
  exists(
    select 1 from public.work_items wi
    where wi.account_id=((storage.foldername(name))[1])::uuid
      and wi.id=((storage.foldername(name))[2])::uuid
      and public.is_assigned_worker(wi.id)
  )
);

create or replace function public.evaluate_work_item_readiness(target_work_item uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  item public.work_items;
  missing_tasks integer;
  missing_task_photos integer;
  missing_notes integer;
  evidence_count integer;
  blocking_issues integer;
  key_required boolean;
  key_count integer;
  reasons jsonb := '[]'::jsonb;
  decision boolean;
begin
  select * into item from public.work_items where id=target_work_item for update;
  if item.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_business_member(item.account_id) or public.is_assigned_worker(item.id)) then raise exception 'forbidden'; end if;

  select count(*) into missing_tasks from public.checklist_tasks where work_item_id=item.id and mandatory and not completed;
  select count(*) into missing_task_photos from public.checklist_tasks t where t.work_item_id=item.id and t.photo_required and not exists(select 1 from public.evidence_submissions e where e.checklist_task_id=t.id);
  select count(*) into missing_notes from public.checklist_tasks where work_item_id=item.id and note_required and nullif(trim(note),'') is null;
  select count(*) into evidence_count from public.evidence_submissions where work_item_id=item.id and evidence_type='completion_photo';
  select count(*) into blocking_issues from public.operational_issues where work_item_id=item.id and blocking and status not in ('resolved','closed');
  select exists(select 1 from public.checklist_tasks where work_item_id=item.id and label ilike '%key%return%' and mandatory) into key_required;
  select count(*) into key_count from public.evidence_submissions where work_item_id=item.id and evidence_type='key_return';

  if item.completion_submitted_at is null then reasons := reasons || '"Completion has not been submitted"'::jsonb; end if;
  if missing_tasks>0 then reasons := reasons || to_jsonb(missing_tasks||' mandatory checklist task'||case when missing_tasks=1 then ' is' else 's are' end||' incomplete'); end if;
  if missing_task_photos>0 then reasons := reasons || to_jsonb(missing_task_photos||' task photo'||case when missing_task_photos=1 then ' is' else 's are' end||' missing'); end if;
  if missing_notes>0 then reasons := reasons || to_jsonb(missing_notes||' required note'||case when missing_notes=1 then ' is' else 's are' end||' missing'); end if;
  if evidence_count<item.required_evidence_count then reasons := reasons || to_jsonb((item.required_evidence_count-evidence_count)||' completion photo'||case when item.required_evidence_count-evidence_count=1 then ' is' else 's are' end||' missing'); end if;
  if key_required and key_count=0 then reasons := reasons || '"Key-return confirmation is missing"'::jsonb; end if;
  if blocking_issues>0 then reasons := reasons || to_jsonb(blocking_issues||' blocking issue'||case when blocking_issues=1 then ' remains' else 's remain' end||' open'); end if;

  decision := jsonb_array_length(reasons)=0;
  update public.work_items set
    readiness_decision=decision,
    readiness_evaluated_at=now(),
    readiness_result=jsonb_build_object('ready',decision,'blocking_reasons',reasons,'mandatory_tasks_missing',missing_tasks,'required_photos_missing',greatest(item.required_evidence_count-evidence_count,0),'blocking_issues',blocking_issues),
    ready_at=case when decision then coalesce(ready_at,now()) else null end,
    status=case when decision then 'ready' when completion_submitted_at is not null then 'action_required' else status end,
    updated_at=now()
  where id=item.id;

  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description,metadata)
  values(item.account_id,item.id,auth.uid(),'readiness_evaluated',case when decision then 'Property marked ready' else 'Property readiness check found outstanding requirements' end,jsonb_build_object('ready',decision,'blocking_reasons',reasons));
  return jsonb_build_object('ready',decision,'blocking_reasons',reasons);
end $$;

create or replace function public.transition_work_item(target_work_item uuid, next_status text)
returns public.work_items language plpgsql security definer set search_path='' as $$
declare current_row public.work_items; result public.work_items; allowed boolean := false;
begin
  select * into current_row from public.work_items where id=target_work_item for update;
  if current_row.id is null then raise exception 'work_item_not_found'; end if;
  if not (public.is_business_member(current_row.account_id) or public.is_assigned_worker(current_row.id)) then raise exception 'forbidden'; end if;
  allowed := case current_row.status
    when 'awaiting_response' then next_status in ('accepted','declined','cancelled')
    when 'accepted' then next_status in ('en_route','cancelled')
    when 'en_route' then next_status in ('arrived','cancelled')
    when 'arrived' then next_status in ('in_progress','cancelled')
    when 'in_progress' then next_status in ('evidence_submitted','action_required','cancelled')
    when 'evidence_submitted' then next_status in ('action_required','cancelled')
    when 'declined' then next_status in ('unassigned','awaiting_response','cancelled')
    when 'unassigned' then next_status in ('awaiting_response','cancelled')
    when 'action_required' then next_status in ('in_progress','cancelled')
    else false end;
  if not allowed then raise exception 'invalid_status_transition:%->%',current_row.status,next_status; end if;
  if next_status='evidence_submitted' then
    update public.work_items set completion_submitted_at=now() where id=target_work_item;
  end if;
  update public.work_items set status=next_status,
    actual_started_at=case when next_status='in_progress' then coalesce(actual_started_at,now()) else actual_started_at end,
    actual_completed_at=case when next_status='evidence_submitted' then now() else actual_completed_at end,
    updated_at=now() where id=target_work_item returning * into result;
  insert into public.activity_events(account_id,work_item_id,actor_user_id,event_type,description)
  values(result.account_id,result.id,auth.uid(),'turnover_'||next_status,'Turnover status changed to '||replace(next_status,'_',' '));
  if next_status='evidence_submitted' then perform public.evaluate_work_item_readiness(target_work_item); end if;
  return result;
end $$;

create or replace function public.accept_worker_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.worker_invitations; worker_name text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into invitation from public.worker_invitations
    where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex')
      and accepted_at is null and revoked_at is null and expires_at>now()
    for update;
  if invitation.id is null then raise exception 'invitation_invalid_or_expired'; end if;
  update public.workers set user_id=auth.uid(),invitation_status='accepted',status='active',updated_at=now()
    where id=invitation.worker_id returning display_name into worker_name;
  update public.worker_invitations set accepted_at=now() where id=invitation.id;
  insert into public.activity_events(account_id,worker_id,actor_user_id,event_type,description)
    values(invitation.account_id,invitation.worker_id,auth.uid(),'cleaner_invitation_accepted',worker_name||' accepted the invitation');
  return invitation.worker_id;
end $$;

create or replace function public.create_default_str_checklist()
returns trigger language plpgsql security definer set search_path='' as $$
declare template uuid; section_id uuid; pos integer := 0;
begin
  insert into public.checklist_templates(account_id,property_id,name)
    values(new.account_id,new.id,'Guest-ready turnover standard') returning id into template;
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Entry and initial inspection',1) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,photo_required,blocking) values
    (section_id,'Check access and record the initial condition',1,true,true,true);
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Bedrooms and linen',2) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,photo_required) values
    (section_id,'Make every required bed to the property standard',1,true,true),
    (section_id,'Place the required towels and linen',2,true,false);
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Bathrooms',3) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,photo_required) values
    (section_id,'Clean and present every bathroom',1,true,true);
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Kitchen and living areas',4) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,photo_required) values
    (section_id,'Clean kitchen surfaces, appliances and sink',1,true,true),
    (section_id,'Reset living areas to the guest-ready standard',2,true,true);
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Consumables and waste',5) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory) values
    (section_id,'Restock required consumables',1,true),
    (section_id,'Remove waste and replace bin liners',2,true);
  insert into public.checklist_template_sections(template_id,title,position) values(template,'Final presentation and security',6) returning id into section_id;
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,response_type,blocking) values
    (section_id,'Complete the final damage and belongings check',1,true,'pass_fail',true);
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,photo_required) values
    (section_id,'Confirm final presentation',2,true,true);
  insert into public.checklist_template_tasks(section_id,label,position,mandatory,note_required,blocking) values
    (section_id,'Confirm keys were returned and the property is secure',3,true,true,true);
  return new;
end $$;

drop trigger if exists properties_default_str_checklist on public.properties;
create trigger properties_default_str_checklist after insert on public.properties
for each row execute function public.create_default_str_checklist();

-- Preserve existing properties and give each one a usable STR checklist.
insert into public.checklist_templates(account_id,property_id,name)
select p.account_id,p.id,'Guest-ready turnover standard'
from public.properties p
where not exists(select 1 from public.checklist_templates t where t.property_id=p.id);

insert into public.checklist_template_sections(template_id,title,position)
select t.id,v.title,v.position from public.checklist_templates t
cross join (values
  ('Entry and initial inspection',1),('Bedrooms and linen',2),('Bathrooms',3),
  ('Kitchen and living areas',4),('Consumables and waste',5),('Final presentation and security',6)
) as v(title,position)
where t.service_code='str_turnover'
  and not exists(select 1 from public.checklist_template_sections s where s.template_id=t.id);

insert into public.checklist_template_tasks(section_id,label,position,response_type,mandatory,photo_required,note_required,blocking)
select s.id,v.label,v.position,v.response_type,v.mandatory,v.photo_required,v.note_required,v.blocking
from public.checklist_template_sections s
join public.checklist_templates t on t.id=s.template_id
join (values
  ('Entry and initial inspection','Check access and record the initial condition',1,'checkbox',true,true,false,true),
  ('Bedrooms and linen','Make every required bed to the property standard',1,'checkbox',true,true,false,false),
  ('Bedrooms and linen','Place the required towels and linen',2,'checkbox',true,false,false,false),
  ('Bathrooms','Clean and present every bathroom',1,'checkbox',true,true,false,false),
  ('Kitchen and living areas','Clean kitchen surfaces, appliances and sink',1,'checkbox',true,true,false,false),
  ('Kitchen and living areas','Reset living areas to the guest-ready standard',2,'checkbox',true,true,false,false),
  ('Consumables and waste','Restock required consumables',1,'checkbox',true,false,false,false),
  ('Consumables and waste','Remove waste and replace bin liners',2,'checkbox',true,false,false,false),
  ('Final presentation and security','Complete the final damage and belongings check',1,'pass_fail',true,false,false,true),
  ('Final presentation and security','Confirm final presentation',2,'checkbox',true,true,false,false),
  ('Final presentation and security','Confirm keys were returned and the property is secure',3,'checkbox',true,false,true,true)
) as v(section_title,label,position,response_type,mandatory,photo_required,note_required,blocking)
on v.section_title=s.title
where t.service_code='str_turnover'
  and not exists(select 1 from public.checklist_template_tasks task where task.section_id=s.id);
