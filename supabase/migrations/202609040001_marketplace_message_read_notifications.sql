alter table public.marketplace_conversations
  add column if not exists customer_last_read_at timestamptz,
  add column if not exists provider_last_read_at timestamptz,
  add column if not exists customer_last_notified_at timestamptz,
  add column if not exists provider_last_notified_at timestamptz;

create or replace function public.mark_marketplace_conversation_read(target_conversation uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  conversation_row public.marketplace_conversations;
  customer_auth_user_id uuid;
begin
  select c.*
    into conversation_row
  from public.marketplace_conversations c
  where c.id = target_conversation
  for update;
  select mc.auth_user_id
    into customer_auth_user_id
  from public.marketplace_customers mc
  where mc.id = conversation_row.customer_id;

  if conversation_row.id is null then raise exception 'conversation_not_found'; end if;
  if auth.uid() is distinct from customer_auth_user_id
     and auth.uid() is distinct from conversation_row.provider_id
     and auth.uid() is distinct from conversation_row.bidder_user_id then
    raise exception 'conversation_not_allowed';
  end if;

  update public.marketplace_conversations
  set customer_last_read_at = case when auth.uid() = customer_auth_user_id then now() else customer_last_read_at end,
      provider_last_read_at = case when auth.uid() = provider_id or auth.uid() = bidder_user_id then now() else provider_last_read_at end
  where id = target_conversation;
end; $$;

revoke all on function public.mark_marketplace_conversation_read(uuid) from public, anon;
grant execute on function public.mark_marketplace_conversation_read(uuid) to authenticated;

create or replace function public.claim_marketplace_message_email_notification(target_conversation uuid, recipient_user_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  conversation_row public.marketplace_conversations;
  customer_auth_user_id uuid;
  recipient_is_customer boolean;
  last_read_at timestamptz;
  last_notified_at timestamptz;
  latest_message_id uuid;
begin
  select c.*
    into conversation_row
  from public.marketplace_conversations c
  where c.id = target_conversation
  for update;
  select mc.auth_user_id
    into customer_auth_user_id
  from public.marketplace_customers mc
  where mc.id = conversation_row.customer_id;

  if conversation_row.id is null then raise exception 'conversation_not_found'; end if;
  recipient_is_customer := recipient_user_id = customer_auth_user_id;
  if not recipient_is_customer
     and recipient_user_id is distinct from conversation_row.provider_id
     and recipient_user_id is distinct from conversation_row.bidder_user_id then
    raise exception 'conversation_recipient_not_allowed';
  end if;

  last_read_at := case when recipient_is_customer then conversation_row.customer_last_read_at else conversation_row.provider_last_read_at end;
  last_notified_at := case when recipient_is_customer then conversation_row.customer_last_notified_at else conversation_row.provider_last_notified_at end;

  if last_notified_at is not null and (last_read_at is null or last_read_at <= last_notified_at) then
    return null;
  end if;

  select m.id into latest_message_id
  from public.marketplace_messages m
  where m.conversation_id = target_conversation
    and m.sender_id is distinct from recipient_user_id
    and (last_read_at is null or m.created_at > last_read_at)
  order by m.created_at desc, m.id desc
  limit 1;
  if latest_message_id is null then return null; end if;

  update public.marketplace_conversations
  set customer_last_notified_at = case when recipient_is_customer then now() else customer_last_notified_at end,
      provider_last_notified_at = case when not recipient_is_customer then now() else provider_last_notified_at end
  where id = target_conversation;
  return latest_message_id;
end; $$;

revoke all on function public.claim_marketplace_message_email_notification(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_marketplace_message_email_notification(uuid, uuid) to service_role;
