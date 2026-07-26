-- Atomic creation helpers and useful V1 workspace defaults.

alter table public.business_accounts
  add column if not exists timezone text not null default 'Europe/London',
  add column if not exists default_checkout_time time not null default '11:00',
  add column if not exists default_checkin_time time not null default '15:00',
  add column if not exists default_turnover_minutes integer not null default 180
    check (default_turnover_minutes between 15 and 1440);

create unique index if not exists workers_account_email_unique
  on public.workers(account_id,lower(email)) where email is not null and status<>'inactive';
create unique index if not exists workers_account_mobile_unique
  on public.workers(account_id,mobile) where mobile is not null and status<>'inactive';

create or replace function public.create_worker_with_invitation(
  target_account uuid,
  target_name text,
  target_company text,
  target_email text,
  target_mobile text,
  target_preferred_contact text,
  target_token_hash text,
  target_expiry timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare created_worker uuid;
begin
  if not public.is_business_member(target_account) then raise exception 'forbidden'; end if;
  if char_length(trim(target_name))<2 then raise exception 'invalid_name'; end if;
  if nullif(trim(target_email),'') is null and nullif(trim(target_mobile),'') is null
    then raise exception 'contact_required'; end if;
  if target_preferred_contact='email' and nullif(trim(target_email),'') is null
    then raise exception 'preferred_email_missing'; end if;
  if target_preferred_contact='mobile' and nullif(trim(target_mobile),'') is null
    then raise exception 'preferred_mobile_missing'; end if;
  if target_preferred_contact not in ('email','mobile')
    then raise exception 'invalid_preferred_contact'; end if;

  insert into public.workers(
    account_id,display_name,company_name,email,mobile,preferred_contact_method,
    invitation_status,status
  ) values(
    target_account,trim(target_name),nullif(trim(target_company),''),
    nullif(lower(trim(target_email)),''),nullif(trim(target_mobile),''),
    target_preferred_contact,'pending','active'
  ) returning id into created_worker;

  insert into public.worker_invitations(
    account_id,worker_id,token_hash,expires_at,created_by
  ) values(
    target_account,created_worker,target_token_hash,target_expiry,auth.uid()
  );

  insert into public.activity_events(
    account_id,worker_id,actor_user_id,event_type,description
  ) values(
    target_account,created_worker,auth.uid(),'cleaner_invited',
    trim(target_name)||' was added and a secure invitation link was created'
  );
  return created_worker;
exception
  when unique_violation then raise exception 'duplicate_worker_contact';
end $$;
