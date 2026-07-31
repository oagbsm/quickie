-- Sprint 3: account-scoped transactional email delivery/idempotency records.
create table if not exists public.transactional_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.business_accounts(id) on delete cascade,
  event_type text not null,
  entity_id uuid,
  recipient text not null,
  idempotency_key text not null unique,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','sent','failed')),
  provider_message_id text,
  error_category text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists transactional_email_account_idx
  on public.transactional_email_deliveries(account_id, created_at desc);
alter table public.transactional_email_deliveries enable row level security;
create policy "members view transactional email deliveries"
  on public.transactional_email_deliveries for select to authenticated
  using (public.is_business_member(account_id));
create policy "admins view transactional email deliveries"
  on public.transactional_email_deliveries for select to authenticated
  using (public.is_quickola_admin());
