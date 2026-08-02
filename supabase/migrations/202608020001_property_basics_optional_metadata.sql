-- Initial property creation only needs the operator's property basics.
-- These fields remain available for later editing from the property workspace.
alter table public.properties
  alter column city drop not null,
  alter column property_type drop not null,
  alter column access_method drop not null;
