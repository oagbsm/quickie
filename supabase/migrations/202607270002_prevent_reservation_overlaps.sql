-- Sprint 1A correction: one property cannot have overlapping non-cancelled stays.
-- The half-open range allows one stay to start exactly when another checks out.

create or replace function public.guard_reservation_overlap()
returns trigger language plpgsql set search_path = '' as $$
declare
  conflict public.reservations;
begin
  -- The transaction lock makes the following lookup and write one serialised
  -- operation per property, including when two inserts begin concurrently.
  perform pg_advisory_xact_lock(
    hashtextextended(
      'reservation-overlap:' || new.account_id::text || ':' || new.property_id::text,
      0
    )
  );

  if new.status = 'cancelled' then return new; end if;

  select candidate.* into conflict
  from public.reservations candidate
  where candidate.account_id = new.account_id
    and candidate.property_id = new.property_id
    and candidate.status <> 'cancelled'
    and candidate.id <> new.id
    and new.check_in_at < candidate.check_out_at
    and new.check_out_at > candidate.check_in_at
  order by candidate.check_in_at, candidate.id
  limit 1;

  if conflict.id is not null then
    raise exception using
      errcode = 'P0001',
      message = 'reservation_overlap',
      detail = jsonb_build_object(
        'reservation_id', conflict.id,
        'check_in_at', conflict.check_in_at,
        'check_out_at', conflict.check_out_at
      )::text;
  end if;
  return new;
end $$;

drop trigger if exists guard_reservation_overlap on public.reservations;
create trigger guard_reservation_overlap
before insert or update of account_id, property_id, check_in_at, check_out_at, status
on public.reservations
for each row execute function public.guard_reservation_overlap();
