insert into storage.buckets (id, name, public)
values ('marketplace-provider-photos', 'marketplace-provider-photos', false)
on conflict (id) do nothing;

-- Keep only outward postcode districts. This turns values such as
-- "SL1 3BQ" and "SL1, 3BQ" into "SL1" and drops standalone fragments
-- such as "3BQ" without changing valid areas.
create temporary table normalized_provider_service_areas (
  provider_id uuid not null,
  postcode_district text not null,
  active boolean not null,
  primary key (provider_id, postcode_district)
) on commit drop;

insert into normalized_provider_service_areas (provider_id, postcode_district, active)
select areas.provider_id, upper(matches.captures[2]), bool_or(areas.active)
from public.marketplace_provider_service_areas areas
cross join lateral regexp_matches(
  areas.postcode_district,
  '(^|[^A-Z0-9])([A-Z]{1,2}[0-9]{1,2}[A-Z]?)([^A-Z0-9]|$)',
  'gi'
) as matches(captures)
where upper(matches.captures[2]) ~ '^SL[1-9]$'
group by areas.provider_id, upper(matches.captures[2]);

delete from public.marketplace_provider_service_areas;

insert into public.marketplace_provider_service_areas (provider_id, postcode_district, active)
select provider_id, postcode_district, active
from normalized_provider_service_areas;
