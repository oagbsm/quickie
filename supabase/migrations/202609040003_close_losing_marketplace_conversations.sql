-- Close only conversations whose provider is not the accepted provider.
-- The accepted/selected quote remains the source of truth during awaiting_booking and booked.
create or replace function public.create_marketplace_message(target_conversation uuid, message_body text)
returns public.marketplace_messages
language plpgsql security definer set search_path = public
as $$
declare
  result public.marketplace_messages;
begin
  if not exists (
    select 1
    from public.marketplace_conversations c
    left join public.marketplace_customers mc on mc.id = c.customer_id
    where c.id = target_conversation
      and (c.provider_id = auth.uid() or c.bidder_user_id = auth.uid() or mc.auth_user_id = auth.uid())
  ) then raise exception 'conversation_not_allowed'; end if;

  if exists (
    select 1
    from public.marketplace_conversations c
    join public.marketplace_quotes q on q.job_id = c.job_id
    where c.id = target_conversation
      and q.status in ('accepted', 'selected')
      and coalesce(c.provider_id, c.bidder_user_id) is distinct from coalesce(q.provider_id, q.bidder_user_id)
  ) then raise exception 'conversation_closed'; end if;

  insert into public.marketplace_messages(conversation_id, sender_id, body)
  values (target_conversation, auth.uid(), trim(message_body))
  returning * into result;
  return result;
end;
$$;

revoke all on function public.create_marketplace_message(uuid, text) from public, anon;
grant execute on function public.create_marketplace_message(uuid, text) to authenticated;

drop policy if exists "marketplace participants send messages" on public.marketplace_messages;
create policy "marketplace participants send messages" on public.marketplace_messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.marketplace_conversations c
    left join public.marketplace_customers mc on mc.id = c.customer_id
    where c.id = conversation_id
      and (c.provider_id = auth.uid() or c.bidder_user_id = auth.uid() or mc.auth_user_id = auth.uid())
      and not exists (
        select 1 from public.marketplace_quotes q
        where q.job_id = c.job_id
          and q.status in ('accepted', 'selected')
          and coalesce(c.provider_id, c.bidder_user_id) is distinct from coalesce(q.provider_id, q.bidder_user_id)
      )
  )
);
