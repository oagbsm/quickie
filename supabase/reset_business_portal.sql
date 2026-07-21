-- DESTRUCTIVE: deletes only Quickola customer business-portal data.
-- Preserves existing residential requests, providers/businesses, matches and admin data.
-- Run only against the intended Supabase project.

begin;

drop trigger if exists on_business_user_created on auth.users;
drop function if exists public.ensure_business_workspace();
drop function if exists public.create_business_account_for_user();
drop function if exists public.is_business_member(uuid);
drop policy if exists "members view own business evidence" on storage.objects;

drop table if exists public.completion_reports cascade;
drop table if exists public.service_area_requests cascade;
drop table if exists public.booking_photos cascade;
drop table if exists public.business_issues cascade;
drop table if exists public.invoices cascade;
drop table if exists public.business_notifications cascade;
drop table if exists public.terms_acceptances cascade;
drop table if exists public.recurring_schedules cascade;
drop table if exists public.business_bookings cascade;
drop table if exists public.properties cascade;
drop table if exists public.business_members cascade;
drop table if exists public.business_accounts cascade;

delete from storage.objects where bucket_id = 'business-evidence';
delete from storage.buckets where id = 'business-evidence';

commit;
