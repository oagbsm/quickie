alter table public.marketplace_jobs
  add column if not exists map_latitude double precision,
  add column if not exists map_longitude double precision;

comment on column public.marketplace_jobs.map_latitude is 'Approximate public map latitude; never an exact residential address.';
comment on column public.marketplace_jobs.map_longitude is 'Approximate public map longitude; never an exact residential address.';
