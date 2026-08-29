alter table public.marketplace_messages alter column body drop not null;
alter table public.marketplace_messages drop constraint if exists marketplace_messages_body_check;
alter table public.marketplace_messages add constraint marketplace_messages_body_check check (body is null or length(trim(body)) between 1 and 4000);

create table if not exists public.marketplace_message_attachments (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.marketplace_messages(id) on delete cascade,
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade, uploader_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique, mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880), created_at timestamptz not null default now()
);
create index if not exists marketplace_message_attachments_message_idx on public.marketplace_message_attachments(message_id, created_at);
alter table public.marketplace_message_attachments enable row level security;
create policy "conversation participants view message attachments" on public.marketplace_message_attachments for select to authenticated using (
  exists (select 1 from public.marketplace_conversations c left join public.marketplace_customers mc on mc.id = c.customer_id where c.id = conversation_id and (c.provider_id = auth.uid() or c.bidder_user_id = auth.uid() or mc.auth_user_id = auth.uid()))
);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('marketplace-message-attachments', 'marketplace-message-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']) on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
