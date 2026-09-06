create table if not exists public.marketplace_provider_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.marketplace_providers(user_id),
  document_type text not null check (document_type in ('provider_terms', 'privacy_notice')),
  document_version text not null,
  event_type text not null check (event_type in ('accepted', 'presented')),
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (provider_id, document_type, document_version, event_type)
);
create index if not exists marketplace_provider_legal_acceptances_provider_idx on public.marketplace_provider_legal_acceptances(provider_id, created_at desc);
comment on table public.marketplace_provider_legal_acceptances is 'Append-only provider legal evidence; privacy_notice/presented records presentation, not GDPR consent.';
alter table public.marketplace_provider_legal_acceptances enable row level security;
drop policy if exists "providers view own legal events" on public.marketplace_provider_legal_acceptances;
create policy "providers view own legal events" on public.marketplace_provider_legal_acceptances for select to authenticated using (provider_id = auth.uid());
drop policy if exists "admins view provider legal events" on public.marketplace_provider_legal_acceptances;
create policy "admins view provider legal events" on public.marketplace_provider_legal_acceptances for select to authenticated using (public.is_quickola_admin());
create or replace function public.prevent_provider_legal_event_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin raise exception 'provider_legal_events_are_append_only' using errcode = '42501'; end;
$$;
drop trigger if exists marketplace_provider_legal_acceptances_no_update on public.marketplace_provider_legal_acceptances;
create trigger marketplace_provider_legal_acceptances_no_update before update or delete on public.marketplace_provider_legal_acceptances for each row execute function public.prevent_provider_legal_event_mutation();
