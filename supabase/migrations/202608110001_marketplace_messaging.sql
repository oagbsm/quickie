create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.marketplace_jobs(id) on delete cascade,
  customer_id uuid not null references public.marketplace_customers(id) on delete cascade,
  provider_id uuid not null references public.cleaner_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.marketplace_job_drafts add column if not exists client_submission_key text unique;
create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists marketplace_messages_conversation_idx on public.marketplace_messages(conversation_id, created_at);
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
create policy "marketplace participants view conversations" on public.marketplace_conversations for select to authenticated using (
  provider_id = auth.uid() or exists (select 1 from public.marketplace_customers c where c.id = customer_id and c.auth_user_id = auth.uid())
);
create policy "marketplace participants view messages" on public.marketplace_messages for select to authenticated using (
  exists (select 1 from public.marketplace_conversations c where c.id = conversation_id and (c.provider_id = auth.uid() or exists (select 1 from public.marketplace_customers mc where mc.id = c.customer_id and mc.auth_user_id = auth.uid())))
);
create policy "marketplace participants send messages" on public.marketplace_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.marketplace_conversations c where c.id = conversation_id and (c.provider_id = auth.uid() or exists (select 1 from public.marketplace_customers mc where mc.id = c.customer_id and mc.auth_user_id = auth.uid())))
);

create or replace function public.create_marketplace_message(target_conversation uuid, message_body text)
returns public.marketplace_messages language plpgsql security definer set search_path = public
as $$
declare result public.marketplace_messages;
begin
  if not exists (select 1 from public.marketplace_conversations c left join public.marketplace_customers mc on mc.id = c.customer_id where c.id = target_conversation and (c.provider_id = auth.uid() or mc.auth_user_id = auth.uid())) then raise exception 'conversation_not_allowed'; end if;
  insert into public.marketplace_messages(conversation_id, sender_id, body) values (target_conversation, auth.uid(), trim(message_body)) returning * into result;
  return result;
end; $$;
revoke all on function public.create_marketplace_message(uuid, text) from public, anon;
grant execute on function public.create_marketplace_message(uuid, text) to authenticated;

create or replace function public.select_marketplace_quote(target_token uuid, target_quote uuid)
returns public.marketplace_bookings language plpgsql security definer set search_path = public
as $$
declare j public.marketplace_jobs; q public.marketplace_quotes; result public.marketplace_bookings;
begin
  select * into j from public.marketplace_jobs where public_token = target_token for update;
  select * into q from public.marketplace_quotes where id = target_quote and job_id = j.id and status = 'submitted';
  if j.id is null or q.id is null or j.status not in ('posted', 'finding_provider') then raise exception 'quote_selection_unavailable'; end if;
  update public.marketplace_quotes set status = 'declined', updated_at = now() where job_id = j.id and id <> q.id and status = 'submitted';
  update public.marketplace_quotes set status = 'selected', updated_at = now() where id = q.id;
  insert into public.marketplace_bookings(job_id, quote_id, customer_id, provider_id, quoted_service_price_pence, booking_fee_pence)
  values(j.id, q.id, j.customer_id, q.provider_id, q.amount_pence, j.booking_fee_pence)
  on conflict(job_id) do update set quote_id = excluded.quote_id, provider_id = excluded.provider_id, updated_at = now()
  returning * into result;
  insert into public.marketplace_conversations(job_id, customer_id, provider_id) values (j.id, j.customer_id, q.provider_id) on conflict(job_id) do update set provider_id = excluded.provider_id;
  update public.marketplace_jobs set status = 'awaiting_booking', updated_at = now() where id = j.id;
  return result;
end; $$;
revoke all on function public.select_marketplace_quote(uuid, uuid) from public, anon;
grant execute on function public.select_marketplace_quote(uuid, uuid) to service_role;
