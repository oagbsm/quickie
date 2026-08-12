create table if not exists public.cleaner_host_invitations (
  id uuid primary key default gen_random_uuid(),
  cleaner_user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  host_name text not null,
  host_email text,
  host_phone text,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','qualified','reward_pending','rewarded','cancelled')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  qualified_at timestamptz,
  reward_status text not null default 'not_eligible' check (reward_status in ('not_eligible','pending','approved','paid'))
);
create index if not exists cleaner_host_invitations_cleaner_idx on public.cleaner_host_invitations(cleaner_user_id, created_at desc);
create unique index if not exists cleaner_host_invitations_active_identity_idx on public.cleaner_host_invitations(cleaner_user_id, lower(coalesce(host_email,'')), coalesce(host_phone,'')) where status in ('pending','accepted','qualified','reward_pending');
alter table public.cleaner_host_invitations enable row level security;
drop policy if exists cleaner_host_invitations_owner_select on public.cleaner_host_invitations;
create policy cleaner_host_invitations_owner_select on public.cleaner_host_invitations for select to authenticated using (cleaner_user_id = auth.uid());

create or replace function public.create_cleaner_host_invitation(
  invitation_name text,
  invitation_email text default null,
  invitation_phone text default null,
  invitation_property uuid default null
) returns table (invitation_id uuid, invite_token text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  cleaner public.cleaner_profiles%rowtype;
  raw_token text;
  created_id uuid;
begin
  select * into cleaner from public.cleaner_profiles where user_id = auth.uid() and role = 'cleaner';
  if cleaner.user_id is null then raise exception 'Cleaner profile is not ready'; end if;
  if nullif(trim(invitation_name),'') is null then raise exception 'Host name is required'; end if;
  if nullif(trim(coalesce(invitation_email,'')),'') is null and nullif(trim(coalesce(invitation_phone,'')),'') is null then raise exception 'Host email or phone is required'; end if;
  if invitation_property is not null and not exists (select 1 from public.properties p where p.id = invitation_property and p.standalone_cleaner_user_id = auth.uid()) then raise exception 'Property is not owned by this cleaner'; end if;
  raw_token := encode(gen_random_bytes(24), 'base64');
  raw_token := translate(raw_token, E'/+', '-_');
  raw_token := replace(raw_token, '=', '');
  insert into public.cleaner_host_invitations(cleaner_user_id, property_id, host_name, host_email, host_phone, token_hash)
  values (auth.uid(), invitation_property, trim(invitation_name), nullif(trim(invitation_email),''), nullif(trim(invitation_phone),''), encode(digest(raw_token, 'sha256'), 'hex'))
  returning id into created_id;
  return query select created_id, raw_token;
exception when unique_violation then
  raise exception 'An active invitation already exists for this host';
end;
$$;
revoke all on function public.create_cleaner_host_invitation(text,text,text,uuid) from public, anon;
grant execute on function public.create_cleaner_host_invitation(text,text,text,uuid) to authenticated;
