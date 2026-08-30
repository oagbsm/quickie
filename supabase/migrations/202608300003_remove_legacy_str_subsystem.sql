-- Remove only empty objects from the retired STR/property-turnover subsystem.
-- Populated legacy tables are intentionally retained and reported with NOTICE.
-- It must run after 202608300001 and 202608300002.

do $$
declare
  table_name text;
  has_rows boolean;
  legacy_tables text[] := array[
    'booking_photos', 'business_issues', 'invoices', 'recurring_schedules',
    'work_item_report_shares', 'work_item_completion_reports',
    'completion_reports', 'evidence_submissions', 'operational_issues',
    'checklist_tasks', 'assignments', 'activity_events', 'worker_push_tokens',
    'cleaner_walkthrough_issues', 'cleaner_walkthrough_scans',
    'worker_invitations', 'property_workers', 'work_items',
    'checklist_template_tasks', 'checklist_template_sections',
    'checklist_templates', 'reservations', 'reservation_events',
    'reservation_sync_issues', 'property_calendar_connections',
    'business_bookings', 'business_notifications', 'service_area_requests',
    'business_enquiries', 'cleaner_host_invitations', 'workers',
    'properties', 'business_members', 'business_accounts', 'cleaner_profiles'
  ];
begin
  create temporary table if not exists legacy_empty_tables (
    table_name text primary key
  ) on commit drop;

  foreach table_name in array legacy_tables loop
    if to_regclass('public.' || table_name) is not null then
      if table_name = 'cleaner_profiles' then
        raise notice 'Retaining legacy table public.cleaner_profiles by explicit safety rule';
      else
        execute format('select exists (select 1 from public.%I limit 1)', table_name)
          into has_rows;
        if has_rows then
          raise notice 'Retaining populated legacy table public.% because it contains data', table_name;
        else
          insert into legacy_empty_tables(table_name) values (table_name)
          on conflict (table_name) do nothing;
          raise notice 'Legacy table public.% is empty and eligible for cleanup', table_name;
        end if;
      end if;
    end if;
  end loop;
end
$$;

-- Remove the legacy view only when its source table is absent or empty.
do $$
declare
  source_has_rows boolean;
begin
  begin
    if to_regclass('public.property_calendar_connections_safe') is null then
      null;
    elsif to_regclass('public.property_calendar_connections') is null then
      drop view public.property_calendar_connections_safe;
    else
      execute 'select exists (select 1 from public.property_calendar_connections limit 1)'
        into source_has_rows;
      if not source_has_rows then
        drop view public.property_calendar_connections_safe;
      else
        raise notice 'Retaining legacy view public.property_calendar_connections_safe because its source table is populated';
      end if;
    end if;
  exception when dependent_objects_still_exist then
    raise notice 'Retaining legacy view public.property_calendar_connections_safe because another database object depends on it';
  end;
  end;
end
$$;

-- Legacy table-owned triggers are removed only for empty legacy tables. Their
-- trigger functions remain below if they could still be needed by retained data.
do $$
begin
  if exists (select 1 from legacy_empty_tables where table_name = 'properties') then
    execute 'drop trigger if exists properties_default_str_checklist on public.properties';
  end if;
  if exists (select 1 from legacy_empty_tables where table_name = 'reservations') then
    execute 'drop trigger if exists guard_reservation_overlap on public.reservations';
  end if;
  if exists (select 1 from legacy_empty_tables where table_name = 'business_members') then
    execute 'drop trigger if exists enforce_business_member_portal_role on public.business_members';
  end if;
  if exists (select 1 from legacy_empty_tables where table_name = 'workers') then
    execute 'drop trigger if exists enforce_worker_portal_role on public.workers';
  end if;
end
$$;

-- Trigger/function dependencies for retained populated tables are deliberately
-- left intact. Empty tables are dropped explicitly, child-first, without CASCADE.
do $$
declare
  candidate_name text;
  drop_order text[] := array[
    'booking_photos', 'business_issues', 'invoices', 'recurring_schedules',
    'work_item_report_shares', 'work_item_completion_reports',
    'completion_reports', 'evidence_submissions', 'operational_issues',
    'checklist_tasks', 'assignments', 'activity_events', 'worker_push_tokens',
    'cleaner_walkthrough_issues', 'cleaner_walkthrough_scans',
    'worker_invitations', 'property_workers', 'work_items',
    'checklist_template_tasks', 'checklist_template_sections',
    'checklist_templates', 'reservations', 'reservation_events',
    'reservation_sync_issues', 'property_calendar_connections',
    'business_bookings', 'business_notifications', 'service_area_requests',
    'business_enquiries', 'cleaner_host_invitations', 'workers',
    'properties', 'business_members', 'business_accounts', 'cleaner_profiles'
  ];
begin
  foreach candidate_name in array drop_order loop
    if exists (select 1 from legacy_empty_tables as empty_table where empty_table.table_name = candidate_name) then
      begin
        execute format('drop table if exists public.%I', candidate_name);
      exception when dependent_objects_still_exist then
        raise notice 'Retaining empty legacy table public.% because another database object depends on it', candidate_name;
      end;
    end if;
  end loop;
end
$$;
