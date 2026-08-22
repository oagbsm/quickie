-- Keep provider eligibility and opportunity matching working for jobs and
-- provider services created before the marketplace taxonomy was consolidated.
-- The application also resolves these aliases when displaying old records.

update public.marketplace_jobs
set service_subtype = case
  when service = 'cleaning' and service_subtype in ('move-in-cleaning', 'move-out-cleaning') then 'move-in-move-out-cleaning'
  when service = 'cleaning' and service_subtype = 'airbnb-short-stay-cleaning' then 'short-stay-cleaning'
  when service = 'cleaning' and service_subtype in ('oven-cleaning', 'carpet-cleaning', 'window-cleaning') then 'specialist-cleaning'
  when service = 'gardening' and service_subtype in ('weeding', 'pruning', 'general-gardening') then 'garden-tidy-up'
  when service = 'gardening' and service_subtype = 'shrub-removal' then 'garden-clearance'
  when service = 'handyman' and service_subtype = 'general-handyman' then 'other-handyman'
  when service = 'handyman' and service_subtype in ('hanging-shelves', 'hanging-pictures-mirrors') then 'wall-hanging-and-shelving'
  when service = 'handyman' and service_subtype = 'curtain-blind-fitting' then 'curtain-and-blind-fitting'
  when service = 'handyman' and service_subtype in ('cabinet-repair', 'furniture-repair') then 'cabinet-and-furniture-repair'
  when service = 'handyman' and service_subtype in ('wall-repair', 'sealing-caulking') then 'minor-home-repairs'
  when service = 'furniture-assembly' and service_subtype in ('ikea-assembly', 'furniture-assembly') then 'furniture-assembly'
  when service = 'furniture-assembly' and service_subtype in ('wardrobe-assembly', 'chest-of-drawers-assembly') then 'wardrobe-and-drawers-assembly'
  when service = 'furniture-assembly' and service_subtype in ('desk-assembly', 'table-chairs-assembly') then 'desk-and-table-assembly'
  when service = 'furniture-assembly' and service_subtype in ('outdoor-furniture-assembly', 'exercise-equipment-assembly') then 'outdoor-and-equipment-assembly'
  when service = 'plumbing' and service_subtype = 'tap-repair' then 'tap-replacement'
  when service = 'plumbing' and service_subtype = 'toilet-replacement' then 'toilet-repair'
  when service = 'plumbing' and service_subtype in ('washing-machine-installation', 'dishwasher-installation') then 'appliance-installation'
  when service = 'plumbing' and service_subtype = 'general-plumbing' then 'other-plumbing'
  when service = 'electrical' and service_subtype in ('light-switch-replacement', 'socket-outlet-replacement') then 'switch-and-socket-replacement'
  when service = 'electrical' and service_subtype = 'general-electrical' then 'other-electrical'
  when service = 'removals' and service_subtype in ('man-and-van', 'furniture-moving') then 'moving-help'
  when service = 'removals' and service_subtype = 'flat-move' then 'house-move'
  when service = 'removals' and service_subtype = 'furniture-collection' then 'collection-and-delivery'
  when service = 'waste-removal' and service_subtype = 'furniture-disposal' then 'furniture-and-bulky-item-disposal'
  when service = 'waste-removal' and service_subtype = 'rubbish-clearance' then 'household-rubbish-removal'
  when service = 'waste-removal' and service_subtype in ('garage-clearance', 'shed-clearance') then 'garage-and-shed-clearance'
  when service = 'painting' and service_subtype in ('room-painting', 'bedroom-painting', 'wall-painting', 'interior-painting') then 'interior-room-painting'
  when service = 'painting' and service_subtype in ('door-painting', 'skirting-woodwork-painting') then 'doors-and-woodwork-painting'
  when service = 'painting' and service_subtype = 'general-decorating' then 'wallpapering-and-decorating'
  when service = 'tv-mounting' and service_subtype = 'tv-installation' then 'tv-mounting'
  when service = 'tv-mounting' and service_subtype in ('picture-mounting', 'mirror-mounting', 'shelf-mounting') then 'picture-mirror-and-shelf-mounting'
  when service = 'window-cleaning' and service_subtype in ('curtain-rail-installation', 'curtain-pole-installation') then 'curtain-rails-and-poles'
  when service = 'window-cleaning' and service_subtype = 'window-treatment-installation' then 'other-window-treatments'
  when service = 'window-cleaning' and service_subtype in ('window-blind-repair', 'curtain-blind-repair') then 'window-treatment-repair'
  else service_subtype
end
where service_subtype is not null;

with mapped as (
  select id, row_number() over (
    partition by provider_id, case
      when category_slug = 'cleaning' and job_type_slug in ('move-in-cleaning', 'move-out-cleaning') then 'move-in-move-out-cleaning'
      when category_slug = 'cleaning' and job_type_slug = 'airbnb-short-stay-cleaning' then 'short-stay-cleaning'
      when category_slug = 'cleaning' and job_type_slug in ('oven-cleaning', 'carpet-cleaning', 'window-cleaning') then 'specialist-cleaning'
      when category_slug = 'gardening' and job_type_slug in ('weeding', 'pruning', 'general-gardening') then 'garden-tidy-up'
      when category_slug = 'gardening' and job_type_slug = 'shrub-removal' then 'garden-clearance'
      when category_slug = 'handyman' and job_type_slug = 'general-handyman' then 'other-handyman'
      when category_slug = 'handyman' and job_type_slug in ('hanging-shelves', 'hanging-pictures-mirrors') then 'wall-hanging-and-shelving'
      when category_slug = 'handyman' and job_type_slug = 'curtain-blind-fitting' then 'curtain-and-blind-fitting'
      when category_slug = 'handyman' and job_type_slug in ('cabinet-repair', 'furniture-repair') then 'cabinet-and-furniture-repair'
      when category_slug = 'handyman' and job_type_slug in ('wall-repair', 'sealing-caulking') then 'minor-home-repairs'
      when category_slug = 'furniture-assembly' and job_type_slug in ('ikea-assembly', 'furniture-assembly') then 'furniture-assembly'
      when category_slug = 'furniture-assembly' and job_type_slug in ('wardrobe-assembly', 'chest-of-drawers-assembly') then 'wardrobe-and-drawers-assembly'
      when category_slug = 'furniture-assembly' and job_type_slug in ('desk-assembly', 'table-chairs-assembly') then 'desk-and-table-assembly'
      when category_slug = 'furniture-assembly' and job_type_slug in ('outdoor-furniture-assembly', 'exercise-equipment-assembly') then 'outdoor-and-equipment-assembly'
      when category_slug = 'plumbing' and job_type_slug = 'tap-repair' then 'tap-replacement'
      when category_slug = 'plumbing' and job_type_slug = 'toilet-replacement' then 'toilet-repair'
      when category_slug = 'plumbing' and job_type_slug in ('washing-machine-installation', 'dishwasher-installation') then 'appliance-installation'
      when category_slug = 'plumbing' and job_type_slug = 'general-plumbing' then 'other-plumbing'
      when category_slug = 'electrical' and job_type_slug in ('light-switch-replacement', 'socket-outlet-replacement') then 'switch-and-socket-replacement'
      when category_slug = 'electrical' and job_type_slug = 'general-electrical' then 'other-electrical'
      when category_slug = 'removals' and job_type_slug in ('man-and-van', 'furniture-moving') then 'moving-help'
      when category_slug = 'removals' and job_type_slug = 'flat-move' then 'house-move'
      when category_slug = 'removals' and job_type_slug = 'furniture-collection' then 'collection-and-delivery'
      when category_slug = 'waste-removal' and job_type_slug = 'furniture-disposal' then 'furniture-and-bulky-item-disposal'
      when category_slug = 'waste-removal' and job_type_slug = 'rubbish-clearance' then 'household-rubbish-removal'
      when category_slug = 'waste-removal' and job_type_slug in ('garage-clearance', 'shed-clearance') then 'garage-and-shed-clearance'
      when category_slug = 'painting' and job_type_slug in ('room-painting', 'bedroom-painting', 'wall-painting', 'interior-painting') then 'interior-room-painting'
      when category_slug = 'painting' and job_type_slug in ('door-painting', 'skirting-woodwork-painting') then 'doors-and-woodwork-painting'
      when category_slug = 'painting' and job_type_slug = 'general-decorating' then 'wallpapering-and-decorating'
      when category_slug = 'tv-mounting' and job_type_slug = 'tv-installation' then 'tv-mounting'
      when category_slug = 'tv-mounting' and job_type_slug in ('picture-mounting', 'mirror-mounting', 'shelf-mounting') then 'picture-mirror-and-shelf-mounting'
      when category_slug = 'window-cleaning' and job_type_slug in ('curtain-rail-installation', 'curtain-pole-installation') then 'curtain-rails-and-poles'
      when category_slug = 'window-cleaning' and job_type_slug = 'window-treatment-installation' then 'other-window-treatments'
      when category_slug = 'window-cleaning' and job_type_slug in ('window-blind-repair', 'curtain-blind-repair') then 'window-treatment-repair'
      else job_type_slug
    end order by qualification_verified desc, active desc, created_at
  ) as row_number
  from public.marketplace_provider_services
)
delete from public.marketplace_provider_services ps using mapped
where ps.id = mapped.id and mapped.row_number > 1;

update public.marketplace_provider_services
set job_type_slug = case
  when category_slug = 'cleaning' and job_type_slug in ('move-in-cleaning', 'move-out-cleaning') then 'move-in-move-out-cleaning'
  when category_slug = 'cleaning' and job_type_slug = 'airbnb-short-stay-cleaning' then 'short-stay-cleaning'
  when category_slug = 'cleaning' and job_type_slug in ('oven-cleaning', 'carpet-cleaning', 'window-cleaning') then 'specialist-cleaning'
  when category_slug = 'gardening' and job_type_slug in ('weeding', 'pruning', 'general-gardening') then 'garden-tidy-up'
  when category_slug = 'gardening' and job_type_slug = 'shrub-removal' then 'garden-clearance'
  when category_slug = 'handyman' and job_type_slug = 'general-handyman' then 'other-handyman'
  when category_slug = 'handyman' and job_type_slug in ('hanging-shelves', 'hanging-pictures-mirrors') then 'wall-hanging-and-shelving'
  when category_slug = 'handyman' and job_type_slug = 'curtain-blind-fitting' then 'curtain-and-blind-fitting'
  when category_slug = 'handyman' and job_type_slug in ('cabinet-repair', 'furniture-repair') then 'cabinet-and-furniture-repair'
  when category_slug = 'handyman' and job_type_slug in ('wall-repair', 'sealing-caulking') then 'minor-home-repairs'
  when category_slug = 'furniture-assembly' and job_type_slug in ('ikea-assembly', 'furniture-assembly') then 'furniture-assembly'
  when category_slug = 'furniture-assembly' and job_type_slug in ('wardrobe-assembly', 'chest-of-drawers-assembly') then 'wardrobe-and-drawers-assembly'
  when category_slug = 'furniture-assembly' and job_type_slug in ('desk-assembly', 'table-chairs-assembly') then 'desk-and-table-assembly'
  when category_slug = 'furniture-assembly' and job_type_slug in ('outdoor-furniture-assembly', 'exercise-equipment-assembly') then 'outdoor-and-equipment-assembly'
  when category_slug = 'plumbing' and job_type_slug = 'tap-repair' then 'tap-replacement'
  when category_slug = 'plumbing' and job_type_slug = 'toilet-replacement' then 'toilet-repair'
  when category_slug = 'plumbing' and job_type_slug in ('washing-machine-installation', 'dishwasher-installation') then 'appliance-installation'
  when category_slug = 'plumbing' and job_type_slug = 'general-plumbing' then 'other-plumbing'
  when category_slug = 'electrical' and job_type_slug in ('light-switch-replacement', 'socket-outlet-replacement') then 'switch-and-socket-replacement'
  when category_slug = 'electrical' and job_type_slug = 'general-electrical' then 'other-electrical'
  when category_slug = 'removals' and job_type_slug in ('man-and-van', 'furniture-moving') then 'moving-help'
  when category_slug = 'removals' and job_type_slug = 'flat-move' then 'house-move'
  when category_slug = 'removals' and job_type_slug = 'furniture-collection' then 'collection-and-delivery'
  when category_slug = 'waste-removal' and job_type_slug = 'furniture-disposal' then 'furniture-and-bulky-item-disposal'
  when category_slug = 'waste-removal' and job_type_slug = 'rubbish-clearance' then 'household-rubbish-removal'
  when category_slug = 'waste-removal' and job_type_slug in ('garage-clearance', 'shed-clearance') then 'garage-and-shed-clearance'
  when category_slug = 'painting' and job_type_slug in ('room-painting', 'bedroom-painting', 'wall-painting', 'interior-painting') then 'interior-room-painting'
  when category_slug = 'painting' and job_type_slug in ('door-painting', 'skirting-woodwork-painting') then 'doors-and-woodwork-painting'
  when category_slug = 'painting' and job_type_slug = 'general-decorating' then 'wallpapering-and-decorating'
  when category_slug = 'tv-mounting' and job_type_slug = 'tv-installation' then 'tv-mounting'
  when category_slug = 'tv-mounting' and job_type_slug in ('picture-mounting', 'mirror-mounting', 'shelf-mounting') then 'picture-mirror-and-shelf-mounting'
  when category_slug = 'window-cleaning' and job_type_slug in ('curtain-rail-installation', 'curtain-pole-installation') then 'curtain-rails-and-poles'
  when category_slug = 'window-cleaning' and job_type_slug = 'window-treatment-installation' then 'other-window-treatments'
  when category_slug = 'window-cleaning' and job_type_slug in ('window-blind-repair', 'curtain-blind-repair') then 'window-treatment-repair'
  else job_type_slug
end
where job_type_slug is not null;
