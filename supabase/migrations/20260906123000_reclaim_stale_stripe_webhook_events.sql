-- Allow a webhook worker interrupted after claiming an event to be reclaimed.
-- A live worker keeps the row locked while it is processing; only rows older
-- than the bounded timeout may be claimed again.
create or replace function public.claim_stripe_webhook_event(target_event_id text, target_event_type text)
returns text language plpgsql security definer set search_path = public
as $$
declare current_status text; started_at timestamptz;
begin
  insert into public.stripe_webhook_events(stripe_event_id, event_type, processing_started_at)
    values (target_event_id, target_event_type, now()) on conflict (stripe_event_id) do nothing;
  select status, processing_started_at into current_status, started_at
    from public.stripe_webhook_events where stripe_event_id = target_event_id for update;
  if current_status = 'failed' or (current_status = 'processing' and started_at < now() - interval '10 minutes') then
    update public.stripe_webhook_events
      set status = 'processing', processing_started_at = now(), processed_at = null, error_message = null
      where stripe_event_id = target_event_id;
    return 'claimed';
  end if;
  return case when current_status = 'processing' then 'duplicate_processing' when current_status = 'processed' then 'duplicate_processed' else 'claimed' end;
end; $$;
revoke all on function public.claim_stripe_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text) to service_role;
