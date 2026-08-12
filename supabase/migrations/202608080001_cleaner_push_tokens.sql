-- Additive notification foundation for the cleaner mobile app.
-- Tokens are scoped to an already-linked worker and never grant data access.
create table if not exists public.worker_push_tokens (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'expo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id, token),
  constraint worker_push_token_platform_check check (platform in ('expo','ios','android'))
);

alter table public.worker_push_tokens enable row level security;

create policy "workers manage own push tokens" on public.worker_push_tokens
  for all to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from public.workers w
    where w.id = worker_id and w.user_id = auth.uid() and w.status = 'active'
  ))
  with check (user_id = auth.uid() and exists (
    select 1 from public.workers w
    where w.id = worker_id and w.user_id = auth.uid() and w.status = 'active'
  ));
