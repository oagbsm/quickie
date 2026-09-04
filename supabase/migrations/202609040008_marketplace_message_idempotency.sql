-- Prevent a retried marketplace message submission from creating a second
-- message. NULL keeps compatibility with older callers while current message
-- composers always provide a client-generated UUID.
alter table public.marketplace_messages
  add column if not exists client_message_id uuid;

create unique index if not exists marketplace_messages_client_submission_uidx
  on public.marketplace_messages(conversation_id, sender_id, client_message_id)
  where client_message_id is not null;

alter table public.marketplace_message_attachments
  add column if not exists client_message_id uuid,
  add column if not exists client_attachment_index integer;

create unique index if not exists marketplace_message_attachments_client_submission_uidx
  on public.marketplace_message_attachments(message_id, client_message_id, client_attachment_index)
  where client_message_id is not null and client_attachment_index is not null;

create or replace function public.create_marketplace_message(
  target_conversation uuid,
  message_body text,
  target_client_message_id uuid
)
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
  ) then
    raise exception 'conversation_not_allowed';
  end if;

  if exists (
    select 1
    from public.marketplace_conversations c
    join public.marketplace_quotes q on q.job_id = c.job_id
    where c.id = target_conversation
      and q.status in ('accepted', 'selected')
      and coalesce(c.provider_id, c.bidder_user_id) is distinct from coalesce(q.provider_id, q.bidder_user_id)
  ) then
    raise exception 'conversation_closed';
  end if;

  insert into public.marketplace_messages(conversation_id, sender_id, body, client_message_id)
  values (target_conversation, auth.uid(), trim(message_body), target_client_message_id)
  on conflict (conversation_id, sender_id, client_message_id)
    where client_message_id is not null
  do nothing
  returning * into result;

  if result.id is null then
    select m.*
      into result
    from public.marketplace_messages m
    where m.conversation_id = target_conversation
      and m.sender_id = auth.uid()
      and m.client_message_id = target_client_message_id;
  end if;

  if result.id is null then
    raise exception 'message_idempotency_lookup_failed';
  end if;
  return result;
end;
$$;

revoke all on function public.create_marketplace_message(uuid, text, uuid) from public, anon;
grant execute on function public.create_marketplace_message(uuid, text, uuid) to authenticated;

-- Do not leave the pre-idempotency overload as a bypass around the unique key.
create or replace function public.create_marketplace_message(target_conversation uuid, message_body text)
returns public.marketplace_messages
language plpgsql security definer set search_path = public
as $$
begin
  raise exception 'client_message_id_required';
end;
$$;

revoke all on function public.create_marketplace_message(uuid, text) from public, anon;
grant execute on function public.create_marketplace_message(uuid, text) to authenticated;
