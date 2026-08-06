-- Room-aware checklist snapshots. Existing generic sections/tasks remain valid
-- because all new metadata is nullable and historical rows are not rewritten.
alter table public.checklist_template_sections
  add column if not exists room_type text;

alter table public.checklist_tasks
  add column if not exists room_type text,
  add column if not exists room_index integer,
  add column if not exists room_instance_id uuid;

create index if not exists checklist_tasks_room_instance_idx
  on public.checklist_tasks(work_item_id, room_instance_id);

create or replace function public.infer_checklist_room_type(raw_title text)
returns text language sql immutable set search_path='' as $$
  select case
    when lower(coalesce(raw_title, '')) like '%bedroom%' then 'bedroom'
    when lower(coalesce(raw_title, '')) like '%bathroom%' then 'bathroom'
    when lower(coalesce(raw_title, '')) = 'kitchen' then 'kitchen'
    when lower(coalesce(raw_title, '')) like '%living room%' then 'living_room'
    when lower(coalesce(raw_title, '')) = 'hallway' then 'hallway'
    when lower(coalesce(raw_title, '')) = 'dining room' then 'dining_room'
    when lower(coalesce(raw_title, '')) = 'utility' then 'utility'
    when lower(coalesce(raw_title, '')) = 'outdoor' then 'outdoor'
    else null
  end
$$;

create or replace function public.set_checklist_section_room_type()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.room_type is null then
    new.room_type := public.infer_checklist_room_type(new.title);
  end if;
  return new;
end $$;

drop trigger if exists checklist_section_room_type on public.checklist_template_sections;
create trigger checklist_section_room_type
before insert or update of title, room_type on public.checklist_template_sections
for each row execute function public.set_checklist_section_room_type();

update public.checklist_template_sections
set room_type = public.infer_checklist_room_type(title)
where room_type is null;

create or replace function public.snapshot_work_item_checklist(target_work_item uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
  item public.work_items;
  property_row public.properties;
  selected_template_id uuid;
  section_row record;
  task_row record;
  room_count integer;
  room_index integer;
  room_id uuid;
  inserted_count integer := 0;
begin
  select * into item from public.work_items where id = target_work_item;
  if item.id is null or not public.is_business_member(item.account_id) then
    raise exception 'forbidden';
  end if;
  if exists (select 1 from public.checklist_tasks where work_item_id = item.id) then
    return 0;
  end if;

  select * into property_row from public.properties where id = item.property_id and account_id = item.account_id;
  select t.id into selected_template_id
  from public.checklist_templates t
  where t.property_id = item.property_id and t.account_id = item.account_id and t.active
  order by t.version desc, t.created_at desc
  limit 1;
  if selected_template_id is null then return 0; end if;

  for section_row in
    select * from public.checklist_template_sections
    where public.checklist_template_sections.template_id = selected_template_id
    order by position
  loop
    room_count := case section_row.room_type
      when 'bedroom' then greatest(coalesce(property_row.bedrooms, 0), 0)
      when 'bathroom' then greatest(floor(coalesce(property_row.bathrooms, 0)), 0)::integer
      else 1
    end;
    if room_count = 0 then continue; end if;

    for room_index in 1..room_count loop
      room_id := gen_random_uuid();
      for task_row in
        select * from public.checklist_template_tasks
        where section_id = section_row.id
        order by position
      loop
        insert into public.checklist_tasks(
          account_id, work_item_id, source_task_id, section_title, label,
          description, position, response_type, mandatory, photo_required,
          note_required, blocking, room_type, room_index, room_instance_id
        ) values (
          item.account_id,
          item.id,
          task_row.id,
          case when section_row.room_type in ('bedroom', 'bathroom')
            then initcap(replace(section_row.room_type, '_', ' ')) || ' ' || room_index
            else section_row.title end,
          task_row.label,
          task_row.description,
          section_row.position * 100000 + room_index * 1000 + task_row.position,
          task_row.response_type,
          task_row.mandatory,
          task_row.photo_required,
          task_row.note_required,
          task_row.blocking,
          section_row.room_type,
          case when section_row.room_type in ('bedroom', 'bathroom') then room_index else null end,
          room_id
        );
        inserted_count := inserted_count + 1;
      end loop;
    end loop;
  end loop;
  return inserted_count;
end $$;

revoke all on function public.snapshot_work_item_checklist(uuid) from public;
grant execute on function public.snapshot_work_item_checklist(uuid) to authenticated;
