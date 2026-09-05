# Quickola legacy / dead-code audit

Audit scope: repository state at commit `07db0ff`, with read-only inspection of
routes, imports, links, actions, Stripe/Supabase references, migrations,
environment names, tests and package usage. No production data or database
objects were changed.

## Executive summary

Quickola is now structurally centred on the marketplace lifecycle: customer job
posting, provider offers, provider selection, payment, messaging, completion,
reviews, disputes/refunds, and guarded provider transfers. The current admin
surface is Overview, Jobs, Bookings, Providers, Customers, Payments, Support,
Audit Log and Settings.

Four Confidence-A application-code items were removed:

- the unused `app/provider/actions.ts` server action;
- the unused `lib/cumar.ts` helper;
- the unused `lib/marketplacePricing.ts` and its unused `lib/cleaningPricing.ts`
  dependency pair;
- the unreachable duplicate implementation in the admin audit route.

The old admin messages page was not deleted as a hard 404. It is now a small
redirect compatibility route to `/admin/support`, because the support page
still had an explicit legacy destination and administrators may have bookmarks.

No migrations, SQL functions, tables, columns, Stripe flows, auth guards,
RLS policies, provider records, customer records, or financial actions were
removed.

## Current product surface

Active customer surface: `/`, `/create-account`, `/sign-in`, `/auth/customer`,
`/auth/customer/publish`, `/post-job/thank-you`, `/my-jobs`, `/jobs`,
`/jobs/[token]`, `/messages`, `/messages/[conversationId]`, and the public
service/location, help, contact, trust, and legal pages.

Active provider surface: `/pro/login`, `/pro/register`, `/work`,
`/work/onboarding`, `/work/jobs/[id]`, `/work/offers`, `/work/messages`,
`/work/messages/[conversationId]`, `/work/payments`, `/work/profile`, and the
tokenised `/provider/invite/[token]` acceptance flow.

Active admin surface: `/admin`, `/admin/jobs`, `/admin/jobs/[id]`,
`/admin/marketplace-bookings`, `/admin/marketplace-bookings/[id]`,
`/admin/providers`, `/admin/providers/[id]`, `/admin/customers`,
`/admin/customers/[id]`, `/admin/payments`, `/admin/support`, `/admin/audit`,
and `/admin/settings`.

## Active routes

The following are active or intentional compatibility routes, based on imports,
navigation, redirects, auth guards and current data usage:

- Public/customer: `/`, `/about`, `/contact`, `/cookies`, `/create-account`,
  `/help`, `/how-it-works`, `/locations`, `/locations/[location]`, `/services`,
  `/services/[service]`, `/services/[service]/[location]`, `/service-area`,
  `/trust-safety`, `/product`, `/pricing-methodology`, `/terms`,
  `/privacy-policy`, `/privacy`, `/llms.txt`, `/post-job/thank-you`, `/jobs`,
  `/jobs/[token]`, `/my-jobs`, `/messages`, `/messages/[conversationId]`,
  `/auth/customer`, `/auth/customer/publish`, `/auth/callback`, and `/sign-in`.
- Provider: `/for-providers` is a permanent compatibility redirect to `/jobs`;
  `/provider` is a compatibility redirect; `/provider/jobs/[id]` is a
  compatibility redirect; `/pro/login`, `/pro/register`, `/provider/invite`,
  `/provider/invite/[token]`, `/provider/invite/accept`, `/work`,
  `/work/onboarding`, `/work/jobs/[id]`, `/work/offers`, `/work/messages`,
  `/work/messages/[conversationId]`, `/work/payments`, and `/work/profile`.
- Admin: all routes listed in Current product surface, plus the route-level
  compatibility redirects `/admin/messages` and `/admin/audit`.
- API: `/api/address-lookup`, `/api/marketplace/messages`,
  `/api/marketplace/quote-notification`, `/api/sandbox/marketplace-email`,
  `/api/stripe/webhook`, `/api/stripe/connect-webhook`, and `/auth/callback`.
  The `/api/sandbox/*` route is intentionally fail-closed outside explicit
  sandbox configuration.

## Legacy routes found

| Route | Evidence | Status | Recommendation |
|---|---|---|---|
| `/admin/messages` | Not in admin navigation; support page is canonical and previously identified it as legacy | Compatibility redirect | Keep redirect until bookmarks are retired |
| `/admin/offers` | No inbound link; reads current quotes but duplicates job/admin operational views | Review | Do not delete automatically; confirm whether operations still use the direct URL |
| `/admin/providers/qualification` | No navigation link; still has a guarded mutation for regulated-service verification | Review | Keep until the manual qualification policy is explicitly retired |
| `/provider` | Redirected by `next.config.ts` | Compatibility | Keep during launch migration |
| `/provider/jobs/[id]` | Redirect route; old action previously targeted it | Compatibility | Keep route; old action removed |
| `/home-tasks` | Explicit redirect to `/` | Compatibility | Keep if external links exist |
| `/screen2`, `/screen3` | Explicit legacy price-flow redirects | Compatibility | Keep if old campaign links exist |
| `/quickola-price-index` | Redirects to pricing methodology | Compatibility | Keep redirect |
| `/quickola-vs-checkatrade-bark-taskrabbit` | Redirects to About | Compatibility | Keep redirect |
| `/solutions/airbnb` | Public short-stay cleaning proposition | Review | It is not the core launch journey; remove or noindex only after marketing decision |
| `/solutions/letting-agents` | Public property-manager proposition not implemented in marketplace data model | Review | Marketing/product decision required |
| `/solutions/offices` | Public commercial-cleaning proposition not implemented as a separate workflow | Review | Marketing/product decision required |
| `/api/cumar-intake` and `/api/cumar-complete` | No repository callers; public API endpoints write legacy `requests` data | Review | External integrations cannot be ruled out; deprecate with telemetry before removal |

## Routes removed

No user-facing route was hard-deleted. `/admin/messages` was converted to a
redirect compatibility route. This is deliberate because direct URL usage is
not fully observable from the repository.

## Components removed

None. Every component candidate had a current import, framework entry-point
role, dynamic import possibility, or unresolved direct-URL dependency. The
component audit therefore found no Confidence-A deletion candidate.

## Legacy actions

### Removed with Confidence A

| Function/file | Evidence |
|---|---|
| `submitProviderOffer` in `app/provider/actions.ts` | No imports or form callers; current provider offer flow is `app/work/actions.ts` and `/work/jobs/[id]` |

### Active marketplace mutations

The following are current and protected: customer job publish/update/cancel,
quote selection/change, customer messaging, completion/review, dispute issue
reporting, refunds, provider quote submission/withdrawal, booking status
advance/cancel, admin provider status/invitation operations, admin dispute
resolution, payout holds, transfer retry/reconciliation, and force settlement.

All financial mutations remain in the existing guarded paths. No duplicate
refund, transfer, dispute, completion, or payment action was removed.

## Legacy STR findings

### Definitely legacy or disconnected

- `lib/cumar.ts` was unreferenced and removed. It represented the earlier Cumar
  request-capture flow.
- `/api/cumar-intake` and `/api/cumar-complete` remain review candidates because
  they are public endpoints with no in-repository callers and write the legacy
  `requests` table. They were not removed without external-traffic evidence.
- `supabase/reset_business_portal.sql` and the dated STR/business/cleaner
  migrations are historical artifacts. They remain untouched.
- `docs/str-v1-route-inventory.md` and `docs/str-v1-redirect-map.md` are
  historical documentation, not runtime product surfaces.

### Generic/current naming that is not dead

- “cleaner” remains a legitimate service/category and appears in current
  marketplace service content and assets.
- “Airbnb” and “short-stay” remain in a public solution page and service alias;
  these are product/marketing review findings, not proof of a runtime STR
  subsystem.
- `cleaner_profiles` appears only in historical migration/test assertions and
  explicitly protects the current provider identity migration; it must not be
  removed from historical migrations.

## SEO / location findings

- `ACTIVE_PUBLIC_SEO_LOCATIONS` contains only `maidenhead` and
  `ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS` contains only `SL6`.
- Dynamic service/location pages generate only active Maidenhead combinations;
  inactive locations are `noindex, follow` and are not in generated params.
- `/locations/[location]` only generates Maidenhead and marks other data
  locations inactive. `/services/[service]/[location]` only generates active
  location combinations.
- `sitemap.ts` includes only active locations and their service combinations;
  it does not expose the dormant Slough/Windsor/London location records.
- `robots.ts` disallows `/admin`, `/jobs/`, and `/post-job/`; private job tokens
  are also marked noindex.
- `marketplaceLocations` includes future/dormant entries (`slough`, `windsor`,
  `london`) for infrastructure, but the public SEO gates prevent them being
  presented as active service areas.
- No route generation was removed. Main remaining review item: ensure the
  `/solutions/*` marketing pages do not imply implemented multi-property or
  commercial workflows before launch.

## Stripe findings

Current Stripe paths are correctly separated:

- Customer payment: `app/jobs/payment-actions.ts`,
  `lib/server/marketplace-payments.ts`, webhook verification, and payment
  finalisation.
- Connect onboarding/readiness: `lib/server/provider-stripe.ts` and provider
  onboarding/profile actions.
- Platform-to-connected-account transfer: `lib/server/marketplace-transfers.ts`
  with reconciliation, database claim, deterministic attempt idempotency, and
  transfer metadata.
- Refunds: `lib/server/marketplace-refunds.ts` with reservation, bounded amount,
  persisted state, and Stripe idempotency.
- Webhooks: `/api/stripe/webhook` and `/api/stripe/connect-webhook`.

There are no current calls to `stripe.payouts`. That is correct: Quickola tracks
platform-to-provider Connect transfers, while connected-account bank payouts
remain Stripe-controlled. The sandbox scenario script creates test objects only
under its explicit guard and is not an application request path.

One duplicate-looking Stripe client exists in the sandbox scenario script, but
it is an intentional test harness. Runtime application Stripe access uses the
shared `getStripe()` helper. No Stripe code was removed.

## Database cleanup candidates

No database object was changed or dropped. Historical migrations remain intact.

| Object | Type | Current references | Risk | Recommendation |
|---|---|---|---|---|
| `requests` | Table | Legacy Cumar APIs only | Unknown external/API data dependency | Review traffic and retention before deprecation |
| Cumar columns/statuses | Columns on `requests` | Legacy Cumar APIs only | Existing data/reporting risk | Do not remove without migration/data audit |
| `business_accounts`, `properties`, `work_items`, `workers`, `operational_issues` and related STR tables | Tables | Historical migrations/docs; no current marketplace runtime | Applied schema/data risk | Candidate for separate database inventory, never drop in cleanup pass |
| `cleaner_profiles` | Historical provider identity object | Historical migrations/tests only | FK/data-history risk | Keep; current provider FK migration explicitly addresses identity transition |
| `marketplace_*` tables/RPCs | Current marketplace | Broad active app/test usage | High financial/lifecycle risk | Do not touch |
| `admin_audit_log`, email ledger tables | Current operations | Admin/audit/transactional email code | Audit and delivery integrity risk | Keep |

## Duplicate business logic

- Provider earnings are centralised in `lib/marketplace/provider-earnings.ts`,
  but a few presentation pages still format related amounts locally. They do
  not currently calculate a different fee; consolidate only with regression
  tests in a later pass.
- Marketplace payment fee calculation is in
  `lib/server/marketplace-payments.ts`; provider settlement intentionally uses
  `provider-earnings.ts`. This is a deliberate server/presentation boundary.
- Postcode normalisation/matching is shared through `uk-address.ts`,
  `provider-job-matching.ts`, and `service-areas.ts`, but legacy Cumar routes
  duplicate postcode parsing independently.
- Lifecycle state is shared through `customer-job-state.ts`, while admin and
  provider pages still render some labels locally. This is a review candidate,
  not a safe deletion.
- Admin/provider/customer authorization is intentionally role-specific; no
  duplicate path was removed because the security boundaries differ.

## Terminology findings

### Current/acceptable

“Customer”, “provider”, “job”, “quote”, “booking”, “customer payment”,
“provider transfer”, “refund”, “issue”, and “review” are used in current
marketplace surfaces.

### Review findings

- `awaiting_booking_fee` remains a persisted legacy status and appears in
  compatibility/payment code. Do not rename without a database migration and
  lifecycle audit.
- “cleaner” appears in generic cleaning-service copy and assets; it is not
  automatically obsolete.
- “property manager”, “Airbnb”, “short-stay”, and commercial/property language
  appear in `/solutions/*` marketing pages and should be product-approved before
  launch.
- Historical STR terms remain in migrations/docs/tests by design.

## Email findings

Current transactional email is in `lib/marketplace/email/transactional.ts`
with persisted delivery/notification deduplication and current customer/provider
routes. Current triggers are connected to marketplace lifecycle events.

`lib/server/notifications.ts` remains active for admin/contact notifications.
The unreferenced `lib/server/marketplace-notifications.ts` delivery helper was
removed; it duplicated the newer transactional email path and had no callers.

No active email template was deleted. Sandbox email delivery is explicitly
guarded and test-only.

## Auth findings

- Admin pages/actions use `requireAdmin` and the admin Supabase client.
- Provider work/onboarding/profile routes use provider access helpers and status
  gates; provider role routing is covered by tests.
- Customer ownership is checked in customer actions and job-token flows.
- Stripe webhook routes verify signatures before processing.
- Server-only Stripe/Supabase keys remain server-side.
- No obvious missing guard was found in the inspected current mutation paths.
- Legacy public Cumar APIs use service-role access without current authenticated
  marketplace ownership; this is a high-priority review item before any external
  exposure, but it was not changed in this audit.

## Admin findings

The coherent launch admin surface is Overview, Jobs, Bookings, Providers,
Customers, Payments, Support, Audit Log and Settings. Navigation matches that
surface.

- `/admin/offers` is an orphaned but current-data view; review before deleting.
- `/admin/providers/qualification` is an orphaned guarded manual tool; review
  against the current qualification policy.
- `/admin/messages` is now a compatibility redirect to Support.
- `/admin/audit` now only re-exports the canonical Activity/Audit implementation;
  the duplicate unreachable code was removed.

## Public page findings

- Essential/current: home, how-it-works, services, active location/service SEO,
  service area, contact/help, trust/safety, provider signup, auth and legal.
- Useful but review: `/solutions/airbnb`, `/solutions/letting-agents`, and
  `/solutions/offices`; their claims describe workflows beyond the core
  customer/provider marketplace.
- Compatibility redirects: `/product`, `/home-tasks`, `/screen2`, `/screen3`,
  `/quickola-price-index`, and the comparison route.
- Legal pages were not removed.

## Dependency findings

All package dependencies have either direct runtime imports, framework/build
use, or test/sandbox use. No package was removed from `package.json` based only
on name similarity. `leaflet` is used by the provider browse map; `sharp` is
used by Next image handling; `@google/genai` is referenced by the Cumar/AI-era
code and needs a separate dependency decision if those APIs are retired.

## Environment variable findings

Names only; values were not printed.

- Current marketplace/runtime: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_CONNECT_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
  `RESEND_REPLY_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `APP_URL`, and Vercel URL
  fallbacks.
- Current provider/address/support: `GETADDRESS_API_KEY`,
  `QUICKOLA_PROVIDER_COUNTRY`, Telegram notification names, and `GEMINI_API_KEY`
  where the legacy Cumar/AI path is used.
- Sandbox-only: `SANDBOX_*`, `QUICKOLA_SANDBOX`,
  `QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX`,
  `QUICKOLA_SCENARIO_EXECUTION_CONFIRM`, and related fixture names.
- Review/deprecation candidates: `CUMAR_MODE`, `SANDBOX_EMAIL_DISPATCH_URL`,
  and Cumar fixture variables, because their only consumers are legacy or test
  paths. Do not remove until external usage is confirmed.

## Test findings

Active coverage is broad: marketplace lifecycle, payment/webhook safety,
refund/transfer idempotency, dispute/completion state, provider onboarding and
matching, messaging, admin operations, customer CRM, financial ledger, sandbox
guards, and role routing.

Legacy/history assertions remain where they protect migrations and identity
transitions. No test was deleted solely because it mentioned a legacy name.

Missing/recommended coverage: route-level assertions for compatibility redirects,
external traffic telemetry for Cumar APIs, and explicit smoke coverage for the
orphaned admin Offers and qualification routes.

## High-risk items left untouched

- Applied migrations and all historical migration files.
- Supabase tables, RPCs, RLS policies, triggers, and production data.
- Stripe checkout, webhook, refund, Connect onboarding, transfer retry,
  reconciliation, and idempotency logic.
- Provider payout holds, dispute protections, completion atomicity, fee
  calculations, and financial state.
- Auth guards and ownership checks.
- Storage/upload behaviour and provider profile photos.
- Public Cumar endpoints and the legacy `requests` table, pending external-use
  evidence.

## Recommended second-pass cleanup

1. Add request telemetry and a deprecation response plan for `/api/cumar-*`.
2. Decide whether `/solutions/*` claims belong in the launch marketing surface.
3. Confirm whether `/admin/offers` and `/admin/providers/qualification` are used
   operationally; then either link them intentionally or retire them.
4. Consolidate duplicated postcode/lifecycle presentation helpers with tests.
5. Inventory historical STR tables against live database usage before proposing
   any migration or drop plan.
6. Review Cumar/AI dependencies and environment names only after endpoint
   retirement is approved.
