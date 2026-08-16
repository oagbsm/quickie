create table if not exists public.marketplace_quote_history (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.marketplace_quotes(id) on delete cascade,
  job_id uuid not null references public.marketplace_jobs(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  amount_pence integer not null check (amount_pence > 0),
  availability_text text,
  message text,
  status text not null check (status in ('superseded', 'declined', 'withdrawn')),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_quote_history_quote_idx
  on public.marketplace_quote_history(quote_id, created_at asc);

alter table public.marketplace_quote_history enable row level security;

drop policy if exists "marketplace participants view quote history" on public.marketplace_quote_history;
create policy "marketplace participants view quote history"
on public.marketplace_quote_history for select to authenticated
using (
  provider_user_id = auth.uid()
  or exists (
    select 1 from public.marketplace_jobs j
    join public.marketplace_customers c on c.id = j.customer_id
    where j.id = marketplace_quote_history.job_id and c.auth_user_id = auth.uid()
  )
);

create or replace function public.submit_marketplace_quote(
  target_job uuid,
  quote_amount integer,
  quote_availability text,
  quote_available_at timestamptz default null,
  quote_availability_text text default null,
  quote_message text default null
)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  j public.marketplace_jobs;
  result public.marketplace_quotes;
begin
  select * into j from public.marketplace_jobs where id = target_job for update;
  if j.id is null or j.status not in ('posted', 'finding_provider') then
    raise exception 'job_not_open_or_booked';
  end if;
  if exists (select 1 from public.marketplace_quotes where job_id = target_job and status in ('accepted', 'selected')) then
    raise exception 'job_already_booked';
  end if;
  if not exists (
    select 1
    from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = auth.uid()
      and ps.active and pa.active
      and ps.category_slug = j.service
      and ps.job_type_slug = j.service_subtype
      and (j.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
      and upper(pa.postcode_district) = upper(split_part(trim(j.postcode), ' ', 1))
  ) then
    raise exception 'provider_not_eligible';
  end if;

  select * into result
  from public.marketplace_quotes
  where job_id = target_job and coalesce(provider_id, bidder_user_id) = auth.uid()
  for update;

  if result.id is not null and result.status in ('accepted', 'selected') then
    raise exception 'offer_locked_after_acceptance';
  end if;

  if result.id is not null then
    insert into public.marketplace_quote_history(
      quote_id, job_id, provider_user_id, amount_pence, availability_text, message, status
    ) values (
      result.id, result.job_id, auth.uid(), result.amount_pence, result.availability_text, result.message, 'superseded'
    );
    update public.marketplace_quotes
    set amount_pence = quote_amount,
        availability_type = quote_availability,
        available_at = quote_available_at,
        availability_text = quote_availability_text,
        message = quote_message,
        status = 'submitted',
        updated_at = now()
    where id = result.id
    returning * into result;
  else
    insert into public.marketplace_quotes(
      job_id, provider_id, bidder_user_id, amount_pence, availability_type,
      available_at, availability_text, message, status
    ) values (
      target_job,
      case when exists (select 1 from public.cleaner_profiles where user_id = auth.uid()) then auth.uid() else null end,
      auth.uid(),
      quote_amount, quote_availability, quote_available_at, quote_availability_text, quote_message, 'submitted'
    ) returning * into result;
  end if;

  update public.marketplace_jobs set status = 'finding_provider', updated_at = now()
  where id = target_job and status = 'posted';
  return result;
end;
$$;

create or replace function public.withdraw_marketplace_quote(target_job uuid)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  j public.marketplace_jobs;
  result public.marketplace_quotes;
begin
  select * into j from public.marketplace_jobs where id = target_job for update;
  select * into result
  from public.marketplace_quotes
  where job_id = target_job and coalesce(provider_id, bidder_user_id) = auth.uid()
  for update;
  if result.id is null then raise exception 'offer_not_found'; end if;
  if j.status not in ('posted', 'finding_provider') or result.status in ('accepted', 'selected') then
    raise exception 'offer_locked_after_acceptance';
  end if;
  if result.status not in ('pending', 'submitted') then raise exception 'offer_not_active'; end if;

  insert into public.marketplace_quote_history(
    quote_id, job_id, provider_user_id, amount_pence, availability_text, message, status
  ) values (
    result.id, result.job_id, auth.uid(), result.amount_pence, result.availability_text, result.message, 'withdrawn'
  );
  update public.marketplace_quotes set status = 'withdrawn', updated_at = now()
  where id = result.id returning * into result;
  return result;
end;
$$;

revoke all on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) from public, anon;
grant execute on function public.submit_marketplace_quote(uuid, integer, text, timestamptz, text, text) to authenticated;
revoke all on function public.withdraw_marketplace_quote(uuid) from public, anon;
grant execute on function public.withdraw_marketplace_quote(uuid) to authenticated;

create or replace function public.accept_marketplace_offer(target_quote uuid)
returns public.marketplace_quotes
language plpgsql security definer set search_path = public
as $$
declare
  chosen public.marketplace_quotes;
  target public.marketplace_jobs;
  bidder uuid;
begin
  select * into target from public.marketplace_jobs where id = (select job_id from public.marketplace_quotes where id = target_quote) for update;
  select q.* into chosen
  from public.marketplace_quotes q
  join public.marketplace_customers c on c.id = target.customer_id
  where q.id = target_quote
    and q.job_id = target.id
    and q.status in ('pending', 'submitted')
    and c.auth_user_id = auth.uid();
  if target.id is null or target.status not in ('posted', 'finding_provider') or chosen.id is null then
    raise exception 'offer_not_available';
  end if;
  bidder := coalesce(chosen.bidder_user_id, chosen.provider_id);

  update public.marketplace_quotes set status = 'declined', updated_at = now()
  where job_id = chosen.job_id and id <> chosen.id and status in ('pending', 'submitted');
  update public.marketplace_quotes set status = 'accepted', updated_at = now()
  where id = chosen.id;
  update public.marketplace_jobs set status = 'awaiting_booking', updated_at = now()
  where id = chosen.job_id;
  insert into public.marketplace_bookings(job_id, quote_id, customer_id, provider_id, quoted_service_price_pence, booking_fee_pence)
  values (chosen.job_id, chosen.id, target.customer_id, bidder, chosen.amount_pence, target.booking_fee_pence)
  on conflict (job_id) do update set quote_id = excluded.quote_id, provider_id = excluded.provider_id, quoted_service_price_pence = excluded.quoted_service_price_pence, updated_at = now();
  select * into chosen from public.marketplace_quotes where id = chosen.id;
  return chosen;
end;
$$;

revoke all on function public.accept_marketplace_offer(uuid) from public, anon;
grant execute on function public.accept_marketplace_offer(uuid) to authenticated;
