alter table public.assignments
  add column if not exists response_due_at timestamptz;

create or replace function public.set_assignment_response_deadline()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  access_time timestamptz;
begin
  if new.response_due_at is null then
    select access_start_at into access_time
    from public.work_items
    where id = new.work_item_id;

    new.response_due_at := greatest(
      now() + interval '2 hours',
      least(now() + interval '24 hours', access_time - interval '4 hours')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists assignments_set_response_deadline on public.assignments;
create trigger assignments_set_response_deadline
before insert on public.assignments
for each row execute function public.set_assignment_response_deadline();

update public.assignments a
set response_due_at = greatest(
  a.assigned_at + interval '2 hours',
  least(a.assigned_at + interval '24 hours', w.access_start_at - interval '4 hours')
)
from public.work_items w
where w.id = a.work_item_id
  and a.response_due_at is null;

create or replace function public.guard_turnover_date()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.turnover_date < current_date - 365
     or new.turnover_date > current_date + 730 then
    raise exception 'turnover_date_outside_allowed_window';
  end if;
  return new;
end;
$$;

drop trigger if exists work_items_guard_turnover_date on public.work_items;
create trigger work_items_guard_turnover_date
before insert or update of turnover_date on public.work_items
for each row execute function public.guard_turnover_date();

