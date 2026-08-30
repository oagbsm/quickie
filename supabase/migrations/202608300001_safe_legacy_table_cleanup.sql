-- Safe cleanup of legacy business-portal tables that have no live product dependency.
-- This migration intentionally does not use CASCADE and never drops a populated table.
-- Review any NOTICE output after applying in a non-production environment.

do $$
begin
  if to_regclass('public.booking_photos') is not null then
    lock table public.booking_photos in access exclusive mode;
    if not exists (select 1 from public.booking_photos limit 1) then
      drop table public.booking_photos;
    else
      raise notice 'Retaining public.booking_photos because it contains data';
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.business_issues') is not null then
    lock table public.business_issues in access exclusive mode;
    if not exists (select 1 from public.business_issues limit 1) then
      drop table public.business_issues;
    else
      raise notice 'Retaining public.business_issues because it contains data';
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.invoices') is not null then
    lock table public.invoices in access exclusive mode;
    if not exists (select 1 from public.invoices limit 1) then
      drop table public.invoices;
    else
      raise notice 'Retaining public.invoices because it contains data';
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.recurring_schedules') is not null then
    lock table public.recurring_schedules in access exclusive mode;
    if not exists (select 1 from public.recurring_schedules limit 1) then
      drop table public.recurring_schedules;
    else
      raise notice 'Retaining public.recurring_schedules because it contains data';
    end if;
  end if;
end
$$;
