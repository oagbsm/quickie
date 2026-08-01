-- Keep operator notifications limited to meaningful state changes.
create or replace function public.sanitize_turnover_notification()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.event_type = 'turnover_en_route' then
    delete from public.notifications where id = new.id;
    return null;
  end if;
  if new.event_type like 'turnover_%' then
    update public.notifications set body = case new.event_type
      when 'turnover_accepted' then 'Cleaner accepted the turnover.'
      when 'turnover_declined' then 'Cleaner declined the turnover.'
      when 'turnover_arrived' then 'Cleaner arrived at the property.'
      when 'turnover_evidence_submitted' then 'Completion submitted for review.'
      else body end where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists sanitize_turnover_notification on public.notifications;
create trigger sanitize_turnover_notification after insert on public.notifications for each row execute function public.sanitize_turnover_notification();
