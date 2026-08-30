create table if not exists public.marketplace_email_notifications (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event_type text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  job_id uuid references public.marketplace_jobs(id) on delete set null,
  conversation_id uuid references public.marketplace_conversations(id) on delete set null,
  booking_id uuid references public.marketplace_bookings(id) on delete set null,
  source_id uuid,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  error_text text
);

alter table public.marketplace_email_notifications enable row level security;
create index if not exists marketplace_email_notifications_event_idx
  on public.marketplace_email_notifications(event_type, created_at desc);
create index if not exists marketplace_email_notifications_job_idx
  on public.marketplace_email_notifications(job_id, event_type);
