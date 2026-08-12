-- Repair migration for the server-side OAuth-pending marketplace draft store.
-- Drafts are accessed only by the Next.js service-role server actions.
create table if not exists public.marketplace_job_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_token uuid not null unique default gen_random_uuid(),
  payload jsonb not null,
  photo_paths jsonb not null default '[]'::jsonb,
  published_job_id uuid unique references public.marketplace_jobs(id) on delete set null,
  client_submission_key text unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.marketplace_customers(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consumed_at timestamptz
);

alter table public.marketplace_job_drafts
  add column if not exists draft_token uuid,
  add column if not exists payload jsonb,
  add column if not exists photo_paths jsonb,
  add column if not exists published_job_id uuid,
  add column if not exists client_submission_key text,
  add column if not exists user_id uuid,
  add column if not exists customer_id uuid,
  add column if not exists expires_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists consumed_at timestamptz;

alter table public.marketplace_job_drafts
  alter column draft_token set default gen_random_uuid(),
  alter column payload set default '{}'::jsonb,
  alter column photo_paths set default '[]'::jsonb,
  alter column expires_at set default (now() + interval '2 hours'),
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.marketplace_job_drafts
set draft_token = coalesce(draft_token, gen_random_uuid()),
    payload = coalesce(payload, '{}'::jsonb),
    photo_paths = coalesce(photo_paths, '[]'::jsonb),
    expires_at = coalesce(expires_at, now() + interval '2 hours'),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where draft_token is null
   or payload is null
   or photo_paths is null
   or expires_at is null
   or created_at is null
   or updated_at is null;

alter table public.marketplace_job_drafts
  alter column draft_token set not null,
  alter column payload set not null,
  alter column photo_paths set not null,
  alter column expires_at set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

create unique index if not exists marketplace_job_drafts_token_idx
  on public.marketplace_job_drafts(draft_token);
create unique index if not exists marketplace_job_drafts_submission_key_idx
  on public.marketplace_job_drafts(client_submission_key)
  where client_submission_key is not null;
create index if not exists marketplace_job_drafts_expiry_idx
  on public.marketplace_job_drafts(expires_at);
create index if not exists marketplace_job_drafts_user_idx
  on public.marketplace_job_drafts(user_id)
  where user_id is not null;
create index if not exists marketplace_job_drafts_customer_idx
  on public.marketplace_job_drafts(customer_id)
  where customer_id is not null;

alter table public.marketplace_job_drafts enable row level security;
revoke all on table public.marketplace_job_drafts from anon, authenticated;

-- The final job uses this reference for publish-once protection.
alter table public.marketplace_jobs
  add column if not exists published_draft_id uuid unique references public.marketplace_job_drafts(id) on delete set null;
