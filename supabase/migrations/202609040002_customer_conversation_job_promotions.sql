-- Customer-approved promotion of private conversation content into job scope.
-- The application uses the service-role client after checking customer ownership.
alter table public.marketplace_job_photos
  add column if not exists source_message_attachment_id uuid references public.marketplace_message_attachments(id) on delete set null;

create unique index if not exists marketplace_job_photos_source_attachment_uidx
  on public.marketplace_job_photos(source_message_attachment_id)
  where source_message_attachment_id is not null;

create table if not exists public.marketplace_job_detail_promotions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.marketplace_jobs(id) on delete cascade,
  source_message_id uuid not null references public.marketplace_messages(id) on delete cascade,
  customer_id uuid not null references public.marketplace_customers(id) on delete cascade,
  detail text not null check (length(trim(detail)) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique(job_id, source_message_id)
);

create index if not exists marketplace_job_detail_promotions_job_idx
  on public.marketplace_job_detail_promotions(job_id, created_at);

alter table public.marketplace_job_detail_promotions enable row level security;
revoke all on public.marketplace_job_detail_promotions from public, anon, authenticated;
grant all on public.marketplace_job_detail_promotions to service_role;
