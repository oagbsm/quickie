-- Stripe test-mode payment state for the existing marketplace booking flow.
alter table public.marketplace_bookings
  add column if not exists conversation_id uuid references public.marketplace_conversations(id) on delete set null,
  add column if not exists amount_pence bigint,
  add column if not exists currency text not null default 'gbp',
  add column if not exists platform_fee_pence bigint not null default 0,
  add column if not exists payment_status text not null default 'pending_payment',
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists cancelled_at timestamptz;

update public.marketplace_bookings
set amount_pence = quoted_service_price_pence
where amount_pence is null;

alter table public.marketplace_bookings
  drop constraint if exists marketplace_bookings_payment_status_check;
alter table public.marketplace_bookings
  add constraint marketplace_bookings_payment_status_check
  check (payment_status in ('pending_payment', 'paid', 'cancelled', 'refunded'));

create unique index if not exists marketplace_bookings_quote_uidx
  on public.marketplace_bookings(quote_id);
create unique index if not exists marketplace_bookings_checkout_session_uidx
  on public.marketplace_bookings(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists marketplace_bookings_payment_intent_uidx
  on public.marketplace_bookings(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

drop policy if exists "customers view own marketplace bookings" on public.marketplace_bookings;
create policy "customers view own marketplace bookings"
on public.marketplace_bookings for select to authenticated
using (
  exists (
    select 1 from public.marketplace_customers c
    where c.id = marketplace_bookings.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "providers view selected bookings" on public.marketplace_bookings;
create policy "providers view selected bookings"
on public.marketplace_bookings for select to authenticated
using (provider_id = auth.uid());
