-- Remove the retired STR/property-turnover subsystem after marketplace provider
-- decoupling. This migration is deliberately fail-safe: it refuses to delete a
-- legacy table that still contains rows, so data can be reviewed before retrying.
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
  foreach table_name in array legacy_tables loop
    if to_regclass('public.' || table_name) is not null then
      execute format('select exists (select 1 from public.%I limit 1)', table_name)
        into has_rows;
      if has_rows then
      raise exception 'Legacy table public.% contains data; review/archive it before cleanup', table_name;
      end if;
    end if;
  end loop;
end
$$;

-- Remove the only legacy view before its source tables.
drop view if exists public.property_calendar_connections_safe;

-- Legacy table-owned triggers are removed explicitly when their table exists.
do $$
begin
  if to_regclass('public.properties') is not null then
    execute 'drop trigger if exists properties_default_str_checklist on public.properties';
  end if;
  if to_regclass('public.reservations') is not null then
    execute 'drop trigger if exists guard_reservation_overlap on public.reservations';
  end if;
  if to_regclass('public.business_members') is not null then
    execute 'drop trigger if exists enforce_business_member_portal_role on public.business_members';
  end if;
  if to_regclass('public.workers') is not null then
    execute 'drop trigger if exists enforce_worker_portal_role on public.workers';
  end if;
  if to_regclass('public.cleaner_profiles') is not null then
    execute 'drop trigger if exists cleaner_profiles_protected_fields on public.cleaner_profiles';
  end if;
end
$$;

drop trigger if exists sanitize_turnover_notification on public.notifications;

-- Drop functions by exact legacy names/signatures discovered in the retired
-- migrations. Identity arguments are resolved from pg_proc so overloaded
-- historical signatures are removed without CASCADE.
do $$
declare
  function_name text;
  legacy_functions text[] := array[
    'accept_worker_invitation', 'assign_work_item_worker',
    'calendar_connection_authorised', 'cancel_manual_reservation',
    'claim_property_calendar_sync', 'cleaner_completion_requirements',
    'cleaner_update_checklist_task', 'clone_property_checklist',
    'complete_property_calendar_sync', 'create_business_account_for_user',
    'create_cleaner_host_invitation', 'create_cleaner_issue',
    'create_cleaner_property', 'create_cleaner_walkthrough_scan',
    'create_cleaner_work_item', 'create_default_str_checklist',
    'create_instant_cleaner_walkthrough_scan', 'create_manual_reservation',
    'create_property_calendar_connection', 'create_work_item_completion_report',
    'create_work_item_report_share', 'create_worker_with_invitation',
    'ensure_business_workspace', 'expire_worker_invitations',
    'finalize_ical_missing_reservations', 'guard_reservation_linked_turnover',
    'guard_reservation_overlap', 'guard_turnover_date',
    'ignore_calendar_overlap_conflict',
    'ignore_calendar_overlap_conflicts_for_property',
    'infer_checklist_room_type', 'initialize_direct_cleaner_profile',
    'is_accepted_worker', 'is_assigned_worker', 'is_business_member',
    'is_standalone_cleaner', 'manage_property_calendar_connection',
    'move_checklist_template_task', 'notify_assigned_worker',
    'notify_issue_created', 'reconcile_ical_reservation',
    'record_calendar_sync_issue', 'record_calendar_sync_issue_with_metadata',
    'record_reservation_event', 'refresh_reservation_turnovers_for_property',
    'reject_cross_portal_role_write', 'resolve_calendar_sync_issue',
    'resolve_cleaner_walkthrough_issue', 'resolve_stale_calendar_overlap_conflicts',
    'sanitize_turnover_notification', 'server_create_business_booking',
    'server_sync_turnover_for_reservation', 'set_checklist_section_room_type',
    'snapshot_work_item_checklist', 'sync_turnover_for_reservation',
    'transition_work_item', 'update_manual_reservation'
  ];
  routine record;
begin
  foreach function_name in array legacy_functions loop
    for routine in
      select p.oid::regprocedure as identity
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = function_name
    loop
      execute format('drop function if exists %s', routine.identity);
    end loop;
  end loop;
end
$$;

-- Child tables first; no CASCADE is used so an unexpected live dependency
-- aborts the migration instead of silently removing it.
drop table if exists public.booking_photos;
drop table if exists public.business_issues;
drop table if exists public.invoices;
drop table if exists public.recurring_schedules;
drop table if exists public.work_item_report_shares;
drop table if exists public.work_item_completion_reports;
drop table if exists public.completion_reports;
drop table if exists public.evidence_submissions;
drop table if exists public.operational_issues;
drop table if exists public.checklist_tasks;
drop table if exists public.assignments;
drop table if exists public.activity_events;
drop table if exists public.worker_push_tokens;
drop table if exists public.cleaner_walkthrough_issues;
drop table if exists public.cleaner_walkthrough_scans;
drop table if exists public.worker_invitations;
drop table if exists public.property_workers;
drop table if exists public.work_items;
drop table if exists public.checklist_template_tasks;
drop table if exists public.checklist_template_sections;
drop table if exists public.checklist_templates;
drop table if exists public.reservations;
drop table if exists public.reservation_events;
drop table if exists public.reservation_sync_issues;
drop table if exists public.property_calendar_connections;
drop table if exists public.business_bookings;
drop table if exists public.business_notifications;
drop table if exists public.service_area_requests;
drop table if exists public.business_enquiries;
drop table if exists public.cleaner_host_invitations;
drop table if exists public.workers;
drop table if exists public.properties;
drop table if exists public.business_members;
drop table if exists public.business_accounts;
drop table if exists public.cleaner_profiles;
