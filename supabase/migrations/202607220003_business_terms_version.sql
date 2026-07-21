-- Rename the controlled-pilot terms version without invalidating existing acceptance records.
update public.terms_acceptances
set terms_version = 'business-pilot-2026-07-22'
where terms_version = 'business-draft-2026-07'
  and not exists (
    select 1 from public.terms_acceptances existing
    where existing.account_id = terms_acceptances.account_id
      and existing.user_id = terms_acceptances.user_id
      and existing.terms_version = 'business-pilot-2026-07-22'
  );

delete from public.terms_acceptances
where terms_version = 'business-draft-2026-07';
