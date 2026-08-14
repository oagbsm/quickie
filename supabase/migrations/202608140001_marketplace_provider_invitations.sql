create table if not exists public.marketplace_provider_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_name text not null,
  phone text,
  category_slug text,
  service_area text,
  provider_user_id uuid references auth.users(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked','failed')),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_send_attempt_at timestamptz,
  last_send_error text
);

create unique index if not exists marketplace_provider_invites_pending_email_idx
  on public.marketplace_provider_invitations(lower(email))
  where status in ('pending','failed');
create index if not exists marketplace_provider_invites_status_idx
  on public.marketplace_provider_invitations(status, created_at desc);
alter table public.marketplace_provider_invitations enable row level security;
create policy "admins manage marketplace provider invitations"
  on public.marketplace_provider_invitations for all to authenticated
  using (public.is_quickola_admin()) with check (public.is_quickola_admin());
