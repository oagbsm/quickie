alter table public.operational_issues
  add constraint operational_issues_id_work_item_unique unique (id, work_item_id);

alter table public.evidence_submissions
  add column if not exists issue_id uuid;

alter table public.evidence_submissions
  add constraint evidence_submissions_issue_work_item_fk
  foreign key (issue_id, work_item_id)
  references public.operational_issues(id, work_item_id)
  on delete cascade;

create index if not exists evidence_submissions_issue_idx on public.evidence_submissions(issue_id) where issue_id is not null;
