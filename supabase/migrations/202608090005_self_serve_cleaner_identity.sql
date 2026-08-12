-- Self-serve cleaner identity bootstrap.
-- An authenticated user with no business membership or worker relationship may
-- intentionally enter the cleaner app and receive a private cleaner profile.
-- The private workspace shell is the existing ownership abstraction used by
-- cleaner-owned properties/work items; no business membership is created.
create or replace function public.initialize_direct_cleaner_profile()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  metadata jsonb;
  profile public.cleaner_profiles;
  workspace uuid;
  display text;
begin
  if current_user_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if exists (select 1 from public.business_members where user_id = current_user_id) then
    raise exception 'business_user_cannot_become_direct_cleaner' using errcode = '42501';
  end if;
  -- An active accepted worker already has a cleaner identity through the
  -- relationship. A revoked/inactive relationship must not lock the user out
  -- of their independent cleaner account.
  if exists (select 1 from public.workers where user_id = current_user_id and status = 'active' and invitation_status = 'accepted') then return null; end if;

  select raw_user_meta_data into metadata from auth.users where id = current_user_id;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  select * into profile from public.cleaner_profiles where user_id = current_user_id for update;
  if profile.workspace_account_id is not null then return current_user_id; end if;
  display := coalesce(nullif(trim(metadata->>'full_name'), ''), 'Cleaner');
  insert into public.business_accounts(name, customer_type)
  values (left(display || '''s Quickola cleans', 160), 'other')
  returning id into workspace;
  if profile.user_id is null then
    insert into public.cleaner_profiles(user_id, role, display_name, workspace_account_id)
    values (current_user_id, 'cleaner', display, workspace);
  else
    update public.cleaner_profiles set workspace_account_id = workspace, updated_at = now()
    where user_id = current_user_id;
  end if;
  return current_user_id;
end;
$$;
revoke all on function public.initialize_direct_cleaner_profile() from public, anon;
grant execute on function public.initialize_direct_cleaner_profile() to authenticated;
