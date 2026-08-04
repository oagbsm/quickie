-- Existing authenticated users may explicitly accept a cleaner invitation
-- without losing an existing business role. Invitation-token and email checks
-- remain the proof of consent; the business action never links user_id early.

drop index if exists public.workers_user_id_unique;
create unique index if not exists workers_user_account_unique
  on public.workers(account_id, user_id) where user_id is not null;

create or replace function public.reject_cross_portal_role_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id then return new; end if;
  if new.user_id is null then return new; end if;
  -- Only the token- and email-validated invitation RPC may attach an existing
  -- business user to a cleaner relationship. Other role writes stay guarded.
  if tg_table_name = 'workers'
     and current_setting('quickola.accepting_cleaner_invitation', true) = 'true'
  then return new; end if;
  if tg_table_name = 'business_members' and exists (
    select 1 from public.workers worker where worker.user_id = new.user_id
  ) then
    raise exception 'cleaner_user_cannot_become_business_member' using errcode = '23514';
  end if;
  if tg_table_name = 'workers' and exists (
    select 1 from public.business_members member where member.user_id = new.user_id
  ) then
    raise exception 'business_user_cannot_become_cleaner' using errcode = '23514';
  end if;
  return new;
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

  select * into worker from public.workers
  where id = invitation.worker_id
  for update;
  if worker.id is null or worker.account_id <> invitation.account_id then
    raise exception 'invitation_invalid';
  end if;
  if worker.email is null or lower(worker.email) <> signed_in_email then
    raise exception 'invitation_email_mismatch';
  end if;
  if invitation.accepted_at is not null then
    if worker.user_id = auth.uid() then return worker.id; end if;
    raise exception 'invitation_already_accepted';
  end if;
  if invitation.revoked_at is not null then raise exception 'invitation_revoked'; end if;
  if invitation.expires_at <= now() then raise exception 'invitation_expired'; end if;
  if worker.user_id is not null and worker.user_id <> auth.uid() then
    raise exception 'worker_already_linked';
  end if;

  perform set_config('quickola.accepting_cleaner_invitation', 'true', true);

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
