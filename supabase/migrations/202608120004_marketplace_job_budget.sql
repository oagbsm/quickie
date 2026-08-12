alter table public.marketplace_jobs
  add column if not exists budget_amount numeric(10,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_jobs_budget_amount_positive'
      and conrelid = 'public.marketplace_jobs'::regclass
  ) then
    alter table public.marketplace_jobs
      add constraint marketplace_jobs_budget_amount_positive
      check (budget_amount is null or budget_amount > 0);
  end if;
end
$$;
