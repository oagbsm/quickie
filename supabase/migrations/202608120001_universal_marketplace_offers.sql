-- One authenticated marketplace identity can post jobs and make offers.
alter table public.marketplace_quotes
  add column if not exists bidder_user_id uuid references auth.users(id) on delete cascade;
alter table public.marketplace_quotes
  alter column provider_id drop not null;
alter table public.marketplace_conversations
  alter column provider_id drop not null;
alter table public.marketplace_conversations
  add column if not exists bidder_user_id uuid references auth.users(id) on delete cascade;

update public.marketplace_quotes
set bidder_user_id = provider_id
where bidder_user_id is null;

create index if not exists marketplace_quotes_bidder_idx
  on public.marketplace_quotes(bidder_user_id, status, created_at desc);
create unique index if not exists marketplace_quotes_job_bidder_uidx
  on public.marketplace_quotes(job_id, bidder_user_id)
  where bidder_user_id is not null;

drop policy if exists "marketplace participants view conversations" on public.marketplace_conversations;
create policy "marketplace participants view conversations" on public.marketplace_conversations for select to authenticated using (
  provider_id = auth.uid() or bidder_user_id = auth.uid() or exists (select 1 from public.marketplace_customers c where c.id = customer_id and c.auth_user_id = auth.uid())
);
drop policy if exists "marketplace participants view messages" on public.marketplace_messages;
create policy "marketplace participants view messages" on public.marketplace_messages for select to authenticated using (
  exists (select 1 from public.marketplace_conversations c where c.id = conversation_id and (c.provider_id = auth.uid() or c.bidder_user_id = auth.uid() or exists (select 1 from public.marketplace_customers mc where mc.id = c.customer_id and mc.auth_user_id = auth.uid())))
);
drop policy if exists "marketplace participants send messages" on public.marketplace_messages;
create policy "marketplace participants send messages" on public.marketplace_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.marketplace_conversations c where c.id = conversation_id and (c.provider_id = auth.uid() or c.bidder_user_id = auth.uid() or exists (select 1 from public.marketplace_customers mc where mc.id = c.customer_id and mc.auth_user_id = auth.uid())))
);

alter table public.marketplace_quotes drop constraint if exists marketplace_quotes_status_check;
alter table public.marketplace_quotes
  add constraint marketplace_quotes_status_check
  check (status in ('pending', 'submitted', 'accepted', 'selected', 'declined', 'withdrawn', 'expired'));

alter table public.marketplace_quotes enable row level security;

drop policy if exists "marketplace users create own offers" on public.marketplace_quotes;
create policy "marketplace users create own offers"
on public.marketplace_quotes for insert to authenticated
with check (
  bidder_user_id = auth.uid()
  and provider_id is null
);

drop policy if exists "marketplace users update own offers" on public.marketplace_quotes;
create policy "marketplace users update own offers"
on public.marketplace_quotes for update to authenticated
using (bidder_user_id = auth.uid() and status in ('pending', 'submitted'))
with check (bidder_user_id = auth.uid());

drop policy if exists "job owners view marketplace offers" on public.marketplace_quotes;
create policy "job owners view marketplace offers"
on public.marketplace_quotes for select to authenticated
using (
  exists (
    select 1 from public.marketplace_jobs j
    join public.marketplace_customers c on c.id = j.customer_id
    where j.id = marketplace_quotes.job_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "marketplace users view own offers" on public.marketplace_quotes;
create policy "marketplace users view own offers"
on public.marketplace_quotes for select to authenticated
using (bidder_user_id = auth.uid());

create or replace function public.submit_marketplace_offer(
  target_job uuid,
  offer_amount integer,
  offer_message text default null,
  offer_availability text default 'Flexible'
)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  target public.marketplace_jobs;
  result public.marketplace_quotes;
begin
  select * into target from public.marketplace_jobs
  where id = target_job and status in ('posted', 'finding_provider');
  if target.id is null then raise exception 'job_not_open'; end if;
  if exists (
    select 1 from public.marketplace_customers c
    where c.id = target.customer_id and c.auth_user_id = auth.uid()
  ) then raise exception 'owner_cannot_offer'; end if;

  select * into result from public.marketplace_quotes
  where job_id = target_job and bidder_user_id = auth.uid();
  if result.id is not null then
    update public.marketplace_quotes set amount_pence = offer_amount, availability_text = offer_availability, message = offer_message, status = 'pending', updated_at = now()
    where id = result.id returning * into result;
    return result;
  end if;

  insert into public.marketplace_quotes (
    job_id, bidder_user_id, amount_pence, availability_type,
    availability_text, message, status
  ) values (
    target_job, auth.uid(), offer_amount, 'flexible',
    offer_availability, offer_message, 'pending'
  )
  returning * into result;
  return result;
end;
$$;

create or replace function public.accept_marketplace_offer(target_quote uuid)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  chosen public.marketplace_quotes;
  target public.marketplace_jobs;
  bidder uuid;
begin
  select q.* into chosen from public.marketplace_quotes q
  join public.marketplace_jobs j on j.id = q.job_id
  join public.marketplace_customers c on c.id = j.customer_id
  where q.id = target_quote and c.auth_user_id = auth.uid();
  if chosen.id is null then raise exception 'offer_not_owned'; end if;
  select * into target from public.marketplace_jobs where id = chosen.job_id;
  bidder := coalesce(chosen.bidder_user_id, chosen.provider_id);

  update public.marketplace_quotes set status = 'declined', updated_at = now()
  where job_id = chosen.job_id and id <> chosen.id and status in ('pending', 'submitted');
  update public.marketplace_quotes set status = 'accepted', updated_at = now()
  where id = chosen.id;
  update public.marketplace_jobs set status = 'awaiting_booking', updated_at = now()
  where id = chosen.job_id;
  insert into public.marketplace_conversations(job_id, customer_id, provider_id, bidder_user_id)
  values (chosen.job_id, target.customer_id, chosen.provider_id, bidder)
  on conflict (job_id) do update set provider_id = excluded.provider_id, bidder_user_id = excluded.bidder_user_id;
  select * into chosen from public.marketplace_quotes where id = chosen.id;
  return chosen;
end;
$$;

revoke all on function public.submit_marketplace_offer(uuid, integer, text, text) from public;
grant execute on function public.submit_marketplace_offer(uuid, integer, text, text) to authenticated;
revoke all on function public.accept_marketplace_offer(uuid) from public;
grant execute on function public.accept_marketplace_offer(uuid) to authenticated;
