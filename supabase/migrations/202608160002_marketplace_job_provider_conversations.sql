-- Allow one private conversation per customer job and provider.
alter table public.marketplace_conversations
  drop constraint if exists marketplace_conversations_job_id_key;

create unique index if not exists marketplace_conversations_job_provider_uidx
  on public.marketplace_conversations (job_id, (coalesce(provider_id, bidder_user_id)));

create or replace function public.get_or_create_marketplace_conversation(
  target_job uuid,
  target_provider uuid default null
)
returns public.marketplace_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  job_row public.marketplace_jobs;
  customer_row public.marketplace_customers;
  provider_user uuid := coalesce(target_provider, current_user_id);
  result public.marketplace_conversations;
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  select * into job_row from public.marketplace_jobs where id = target_job;
  if job_row.id is null then raise exception 'job_not_found'; end if;
  select * into customer_row from public.marketplace_customers where id = job_row.customer_id;
  if customer_row.id is null then raise exception 'customer_not_found'; end if;

  if customer_row.auth_user_id = current_user_id then
    if target_provider is null then raise exception 'provider_required'; end if;
    if not exists (select 1 from public.marketplace_quotes q where q.job_id = target_job and coalesce(q.provider_id, q.bidder_user_id) = provider_user) then
      raise exception 'provider_not_connected';
    end if;
  elsif provider_user <> current_user_id or not exists (
    select 1 from public.cleaner_profiles p
    where p.user_id = current_user_id and p.marketplace_active = true
  ) then
    raise exception 'conversation_not_allowed';
  end if;
  if customer_row.auth_user_id <> current_user_id and not exists (
    select 1
    from public.marketplace_provider_services ps
    join public.marketplace_provider_service_areas pa on pa.provider_id = ps.provider_id
    where ps.provider_id = current_user_id and ps.active and pa.active
      and ps.category_slug = job_row.service
      and ps.job_type_slug = job_row.service_subtype
      and (job_row.service not in ('plumbing', 'electrical', 'smart-home') or ps.qualification_verified)
      and upper(pa.postcode_district) = upper(split_part(trim(job_row.postcode), ' ', 1))
  ) and not exists (
    select 1 from public.marketplace_quotes q
    where q.job_id = target_job and coalesce(q.provider_id, q.bidder_user_id) = current_user_id
  ) then
    raise exception 'provider_not_eligible';
  end if;

  select * into result
  from public.marketplace_conversations c
  where c.job_id = target_job and coalesce(c.provider_id, c.bidder_user_id) = provider_user
  limit 1;
  if result.id is not null then return result; end if;

  insert into public.marketplace_conversations(job_id, customer_id, provider_id, bidder_user_id)
  values (
    target_job,
    job_row.customer_id,
    case when exists (select 1 from public.cleaner_profiles p where p.user_id = provider_user) then provider_user else null end,
    provider_user
  )
  on conflict do nothing
  returning * into result;

  if result.id is null then
    select * into result from public.marketplace_conversations c
    where c.job_id = target_job and coalesce(c.provider_id, c.bidder_user_id) = provider_user
    limit 1;
  end if;
  return result;
end;
$$;

revoke all on function public.get_or_create_marketplace_conversation(uuid, uuid) from public, anon;
grant execute on function public.get_or_create_marketplace_conversation(uuid, uuid) to authenticated;

-- Keep the legacy customer acceptance RPC compatible with the new key.
create or replace function public.select_marketplace_quote(target_token uuid, target_quote uuid)
returns public.marketplace_bookings
language plpgsql security definer set search_path = public
as $$
declare j public.marketplace_jobs; q public.marketplace_quotes; result public.marketplace_bookings;
begin
  select * into j from public.marketplace_jobs where public_token = target_token for update;
  select * into q from public.marketplace_quotes where id = target_quote and job_id = j.id and status in ('submitted', 'pending');
  if j.id is null or q.id is null or j.status not in ('posted', 'finding_provider') then raise exception 'quote_selection_unavailable'; end if;
  update public.marketplace_quotes set status = 'declined', updated_at = now() where job_id = j.id and id <> q.id and status in ('submitted', 'pending');
  update public.marketplace_quotes set status = 'selected', updated_at = now() where id = q.id;
  insert into public.marketplace_bookings(job_id, quote_id, customer_id, provider_id, quoted_service_price_pence, booking_fee_pence)
  values(j.id, q.id, j.customer_id, coalesce(q.provider_id, q.bidder_user_id), q.amount_pence, j.booking_fee_pence)
  on conflict(job_id) do update set quote_id = excluded.quote_id, provider_id = excluded.provider_id, updated_at = now()
  returning * into result;
  update public.marketplace_jobs set status = 'awaiting_booking', updated_at = now() where id = j.id;
  insert into public.marketplace_conversations(job_id, customer_id, provider_id, bidder_user_id)
  values(j.id, j.customer_id, q.provider_id, coalesce(q.provider_id, q.bidder_user_id))
  on conflict do nothing;
  return result;
end;
$$;

revoke all on function public.select_marketplace_quote(uuid, uuid) from public, anon;
grant execute on function public.select_marketplace_quote(uuid, uuid) to service_role;
