create or replace function public.guard_turnover_date()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.turnover_date < current_date - 365 then
    raise exception 'turnover_date_outside_allowed_window';
  end if;
  return new;
end;
$$;
