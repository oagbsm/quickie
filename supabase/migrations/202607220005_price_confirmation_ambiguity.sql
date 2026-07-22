-- Resolve the parameter/column name collision found by the disposable workflow test.
create or replace function public.admin_confirm_booking_price(target_booking uuid,price_pence integer,override_reason text default null)
returns public.business_bookings language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare old public.business_bookings; result public.business_bookings; overridden boolean;
begin
 if not public.is_quickola_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if price_pence is null or price_pence<=0 then raise exception 'invalid_price'; end if;
 select * into old from public.business_bookings where id=target_booking for update;
 if old.status not in ('requested','under_review','awaiting_customer_confirmation') then raise exception 'booking_not_awaiting_price_review'; end if;
 overridden := old.estimated_price_pence is distinct from price_pence;
 if overridden and length(trim(coalesce(override_reason,'')))<5 then raise exception 'override_reason_required'; end if;
 update public.business_bookings b set agreed_price_pence=price_pence,price_pence=price_pence,price_override_reason=case when overridden then trim(override_reason) end,
  price_overridden_by=case when overridden then auth.uid() end,price_overridden_at=case when overridden then now() end,
  customer_price_accepted=not overridden,customer_price_accepted_at=case when not overridden then now() end,
  status=case when overridden then 'awaiting_customer_confirmation' else 'confirmed' end,updated_at=now()
 where b.id=target_booking returning b.* into result;
 insert into public.admin_audit_log(admin_user_id,action,entity_type,entity_id,previous_value,new_value)
 values(auth.uid(),case when overridden then 'price_change_requested' else 'booking_confirmed' end,'business_booking',target_booking,
 jsonb_build_object('price',old.agreed_price_pence,'status',old.status),jsonb_build_object('price',price_pence,'status',result.status,'reason',override_reason));
 return result;
end $$;
