# STR V1 redirect and deprecation map

Quickola V1 is an STR turnover-coordination product. The legacy managed-cleaning
implementation remains in the repository temporarily so production records can
be preserved during rollout, but the conflicting user journeys are unreachable.

## Public managed-cleaning routes

Legacy booking, price, result, service-area, service, location and provider pages
permanently redirect to `/product`. `/privacy` redirects to `/privacy-policy`.
The canonical list is maintained in `next.config.ts`.

## Owner portal routes

- `/business/bookings/**` → `/business/turnovers`
- `/business/schedule` → `/business/turnovers`
- `/business/billing` → `/business/settings`
- `/business/account` → `/business/settings`

## Internal routes

- `/admin/bookings/**` → `/admin/turnovers`
- `/admin/providers` → `/admin/cleaners`
- `/admin/customers/**` → `/admin/accounts`
- `/admin/enquiries` → `/admin/accounts`
- `/qk-ops-7f3a/**` → `/admin`
- `/qk-ops-7f3a-login` → `/admin/login`

These are permanent redirects with direct replacements. Old database tables are
not deleted by the STR migrations; they remain available for controlled data
migration or rollback and are not used by the STR portal.
