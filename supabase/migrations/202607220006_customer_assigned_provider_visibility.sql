-- Customers may see the provider assigned to their own booking only once the
-- booking has reached a lifecycle stage where assignment is customer-visible.
create policy "members view own assigned providers"
on public.service_providers
for select
to authenticated
using (
  exists (
    select 1
    from public.business_bookings booking
    where booking.assigned_provider_id = service_providers.id
      and public.is_business_member(booking.account_id)
      and booking.status in (
        'provider_assigned',
        'on_the_way',
        'arrived',
        'in_progress',
        'completed'
      )
  )
);
