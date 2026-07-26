alter table public.operational_issues
  add column if not exists assigned_admin_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_admin_at timestamptz;

create index if not exists operational_issues_admin_owner_idx
  on public.operational_issues(assigned_admin_id, status)
  where assigned_admin_id is not null;
