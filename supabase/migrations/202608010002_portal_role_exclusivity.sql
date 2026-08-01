-- One auth identity must resolve to one product portal.
-- Existing dual-role rows are intentionally not deleted automatically: removing
-- a business owner or accepted worker can destroy access to live account data.

create unique index if not exists workers_user_id_unique
  on public.workers(user_id) where user_id is not null;

create or replace function public.reject_cross_portal_role_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is not distinct from old.user_id then return new; end if;
  end if;
  if new.user_id is null then return new; end if;

  if tg_table_name = 'business_members' and exists (
    select 1 from public.workers worker where worker.user_id = new.user_id
  ) then
    raise exception 'cleaner_user_cannot_become_business_member'
      using errcode = '23514';
  end if;
  if tg_table_name = 'workers' and exists (
    select 1 from public.business_members member
    where member.user_id = new.user_id
  ) then
    raise exception 'business_user_cannot_become_cleaner'
      using errcode = '23514';
  end if;
  return new;
end; $$;

drop trigger if exists enforce_business_member_portal_role
  on public.business_members;
create trigger enforce_business_member_portal_role
before insert or update of user_id on public.business_members
for each row execute function public.reject_cross_portal_role_write();

drop trigger if exists enforce_worker_portal_role
  on public.workers;
create trigger enforce_worker_portal_role
before insert or update of user_id on public.workers
for each row execute function public.reject_cross_portal_role_write();

create or replace function public.ensure_business_workspace()
returns table(account_id uuid, role text, provisioned boolean)
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  resolved_account uuid;
  resolved_role text;
  created_now boolean := false;
  metadata jsonb;
  account_name text;
  account_type text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select member.account_id, member.role
    into resolved_account, resolved_role
  from public.business_members member
  where member.user_id = current_user_id
  limit 1;

  if resolved_account is null then
    select account.id into resolved_account
    from public.business_accounts account
    where account.owner_user_id = current_user_id
    limit 1;

    select auth_user.raw_user_meta_data into metadata
    from auth.users auth_user
    where auth_user.id = current_user_id;

    if exists (
      select 1 from public.workers worker
      where worker.user_id = current_user_id
    ) then
      raise exception 'cleaner_portal_role_exists' using errcode = '42501';
    end if;

    -- Never turn an arbitrary authenticated identity (especially a cleaner
    -- invitation identity) into a business owner as a fallback.
    if resolved_account is null
      and coalesce(metadata->>'account_kind', '') <> 'quickola_business' then
      raise exception 'business_portal_role_required' using errcode = '42501';
    end if;

    if resolved_account is null then
      account_name := coalesce(
        nullif(trim(metadata->>'business_name'), ''),
        'My properties'
      );
      account_type := coalesce(nullif(metadata->>'customer_type', ''), 'other');
      if account_type not in (
        'landlord', 'airbnb_operator', 'letting_agent', 'property_manager',
        'office_business', 'block_manager', 'other'
      ) then
        account_type := 'other';
      end if;
      insert into public.business_accounts(
        name, customer_type, phone, owner_user_id
      ) values (
        account_name, account_type, metadata->>'phone', current_user_id
      )
      on conflict (owner_user_id) where owner_user_id is not null
        do update set updated_at = public.business_accounts.updated_at
      returning id into resolved_account;
      created_now := true;
    end if;

    insert into public.business_members(account_id, user_id, full_name, role)
    values (
      resolved_account,
      current_user_id,
      coalesce(nullif(trim(metadata->>'full_name'), ''), 'Account owner'),
      'owner'
    )
    on conflict (user_id) do nothing;
  end if;

  select member.account_id, member.role
    into resolved_account, resolved_role
  from public.business_members member
  where member.user_id = current_user_id
  limit 1;
  if resolved_account is null then raise exception 'workspace_membership_unresolved'; end if;
  return query select resolved_account, resolved_role, created_now;
end; $$;

create or replace function public.accept_worker_invitation(
  raw_token text,
  confirmed_name text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  invitation public.worker_invitations;
  worker public.workers;
  worker_name text;
  signed_in_email text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(confirmed_name)) < 2
    or char_length(trim(confirmed_name)) > 120 then
    raise exception 'invalid_confirmed_name';
  end if;
  signed_in_email := lower(coalesce(auth.jwt()->>'email', ''));

  select * into invitation
  from public.worker_invitations
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
  for update;
  if invitation.id is null then raise exception 'invitation_invalid'; end if;
  if invitation.accepted_at is not null then raise exception 'invitation_already_accepted'; end if;
  if invitation.revoked_at is not null then raise exception 'invitation_revoked'; end if;
  if invitation.expires_at <= now() then raise exception 'invitation_expired'; end if;

  select * into worker from public.workers
  where id = invitation.worker_id
  for update;
  if worker.id is null or worker.account_id <> invitation.account_id then
    raise exception 'invitation_invalid';
  end if;
  if worker.email is null or lower(worker.email) <> signed_in_email then
    raise exception 'invitation_email_mismatch';
  end if;
  if exists (
    select 1 from public.business_members member where member.user_id = auth.uid()
  ) then
    raise exception 'business_user_cannot_accept_cleaner_invitation';
  end if;
  if worker.user_id is not null and worker.user_id <> auth.uid() then
    raise exception 'worker_already_linked';
  end if;
  if exists (
    select 1 from public.workers existing
    where existing.user_id = auth.uid() and existing.id <> worker.id
  ) then
    raise exception 'user_already_linked_to_worker';
  end if;

  update public.workers
  set user_id = auth.uid(),
      display_name = trim(confirmed_name),
      invitation_status = 'accepted',
      status = 'active',
      updated_at = now()
  where id = worker.id
  returning display_name into worker_name;

  update public.worker_invitations
  set accepted_at = now()
  where id = invitation.id and accepted_at is null;

  insert into public.activity_events(
    account_id, worker_id, actor_user_id, event_type, description
  ) values (
    invitation.account_id,
    worker.id,
    auth.uid(),
    'cleaner_invitation_accepted',
    worker_name || ' accepted the invitation'
  );
  perform public.notify_account_owners(
    invitation.account_id,
    null,
    'cleaner_invitation_accepted',
    'Cleaner invitation accepted',
    worker_name || ' can now receive turnover assignments.'
  );
  return worker.id;
end; $$;
