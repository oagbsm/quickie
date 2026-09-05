# Quickola legacy / dead-code audit

Audit scope: repository-wide import, route, link, action, API, dependency,
test, migration, environment-name, and generated-output review through the
second cleanup pass. No production data, Supabase objects, Stripe objects, or
database migrations were changed.

## Executive summary

Quickola is centred on the current marketplace lifecycle: customer job
posting, provider offers, provider selection, payment, messaging, completion,
reviews, disputes/refunds, payout holds, and guarded provider transfers.

The first pass removed unreferenced marketplace-era helpers and actions. The
second pass removed disconnected application surfaces with no current callers:

- Cumar intake/complete API routes and the unused `@google/genai` dependency;
- the three unsupported `/solutions/*` marketing routes and their shared page;
- `/screen2`, `/screen3`, and `/home-tasks` compatibility page files;
- orphaned admin Offers and provider Qualification route files;
- old provider route files under `/provider` and `/provider/jobs/[id]`;
- the now-unneeded `setMarketplaceProviderQualification` admin action.

The current provider system remains under `/work`; the `/provider` and
`/for-providers` URL redirects in `next.config.ts` remain intentional launch
compatibility. Historical migrations, tables, RPCs, RLS, and data were not
deleted or modified.

## Current launch surface

The canonical route/module inventory is maintained in
[`docs/launch-surface.md`](./launch-surface.md). The surviving product
surfaces are customer marketplace routes, `/work` provider routes, the current
admin portal, Stripe/webhook APIs, address lookup, marketplace messaging and
notifications, and explicitly sandbox-gated test APIs.

Intentional compatibility remains for `/product`,
`/quickola-price-index`, the comparison page, `/privacy`, `/results`,
`/provider`, `/for-providers`, `/admin/messages`, and `/admin/audit`.

## Removed application code

| Area | Removed | Evidence |
|---|---|---|
| Cumar | `app/api/cumar-intake`, `app/api/cumar-complete` | No repository callers; legacy `requests` writer |
| Cumar/AI dependency | `@google/genai` | No remaining runtime import |
| Marketing | `/solutions/airbnb`, `/solutions/letting-agents`, `/solutions/offices`, `SolutionPage` | Unsupported workflows and no remaining route consumers |
| Old public pages | `/screen2`, `/screen3`, `/home-tasks` | Redirect-only legacy pages with no current callers |
| Old provider pages | `/provider`, `/provider/jobs/[id]` page files | Replaced by `/work`; config redirects remain |
| Orphan admin | `/admin/offers`, `/admin/providers/qualification` | No navigation/inbound route callers; duplicated or retired operations |
| Admin action | `setMarketplaceProviderQualification` | Only caller was the removed qualification page |

Earlier verified removals remain documented in history: the old provider
`submitProviderOffer` action, `lib/cumar.ts`, obsolete pricing helpers,
`lib/server/marketplace-notifications.ts`, and unreachable duplicate audit
implementation.

## Protected systems

No files were changed in the core financial or authorization systems. Stripe
checkout, payment finalisation, webhooks, refunds, Connect onboarding,
provider transfers, transfer reconciliation/idempotency, payout holds,
completion/review/dispute actions, provider onboarding, auth guards, RLS,
current admin operations, transactional email, and marketplace RPCs remain
intact.

Applied migrations and historical STR/business/cleaner migrations remain
untouched. The legacy `requests` table and its Cumar-era columns remain in the
database for a separate data/traffic retirement decision.

## Links, imports, and compatibility

The second-pass source scan found no accidental references to removed Cumar,
solution, screen, home-task, Offers, Qualification, or old provider-job paths.
The `/admin/messages` link from Support is intentionally served by a redirect
to `/admin/support`. Config-level compatibility redirects are retained for
bookmarks and external links. No accidental dead links remain in application
source after the cleanup.

## Database and environment findings

No database changes were required. Retained review candidates include the
legacy `requests` table, historical STR tables, and `cleaner_profiles`; these
must not be dropped during application cleanup.

Current runtime environment names remain in use for Supabase, Stripe, Resend,
address lookup, site URLs, and sandbox execution. Cumar-specific environment
names may now be deployment-only leftovers and should be removed separately
only after checking deployment configuration and external traffic.

## Validation and follow-up

Validation for this pass is recorded in the final task report. The cleanup is
a source/build-graph reduction; it does not establish a runtime performance
claim. Manual review is still appropriate for compatibility URL traffic,
deployment environment leftovers, legacy database retention, and any external
consumer of the retired Cumar endpoints.
