-- A booking request is a single business event. Retried idempotent submissions
-- must not create a second request event for the same booking.

delete from public.booking_events duplicate
using public.booking_events original
where duplicate.booking_id = original.booking_id
  and duplicate.event_type = 'booking_requested'
  and original.event_type = 'booking_requested'
  and duplicate.id > original.id;

create unique index if not exists booking_events_one_request_per_booking_idx
  on public.booking_events(booking_id, event_type)
  where event_type = 'booking_requested';
