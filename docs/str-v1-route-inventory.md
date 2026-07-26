# Quickola STR V1 route inventory

This inventory is derived from the App Router filesystem and `next.config.ts`.
Legacy routes listed in the redirect map are compiled for data preservation but
are not reachable product surfaces.

| Route group | User | Auth | Purpose / canonical data | Primary action | Empty state | Responsive and coverage |
|---|---|---|---|---|---|---|
| `/`, `/product`, `/terms`, `/privacy-policy`, `/llms.txt` | Public | No | Product, legal and machine-readable positioning | Create account | Not applicable | SSR, desktop/mobile Playwright, axe, overflow |
| `/business/sign-up`, `/business/sign-in`, `/business/update-password`, `/auth/callback` | Owner | No/session callback | Supabase Auth | Create or recover account | Not applicable | Desktop/mobile smoke and protected-route tests |
| `/business/onboarding` | Owner | Yes | `business_accounts`, `properties`, `workers` | Complete next onboarding step | Add first property | Responsive progressive flow; backend integration |
| `/business/dashboard` | Owner | Yes | `properties`, `work_items`, `operational_issues`, `activity_events` | Create turnover | Three-step setup guidance | Desktop composition, loading/error boundaries, integration consistency |
| `/business/properties` | Owner | Yes | Canonical `properties` with `work_items` | Add property | Add first property to define its turnover standard | Grid/cards, search/filter, query errors surfaced |
| `/business/properties/new` | Owner | Yes | Canonical `properties` and checklist template trigger | Create property | Not applicable | Five-step draft-preserving wizard, mobile controls |
| `/business/properties/[id]` and `/[id]/cleaners` | Owner | Yes | Property, standards, checklist, default workers, history, activity | Save standard / assign default cleaner | Section-specific factual states | Responsive sections; account-scoped RLS |
| `/business/turnovers`, `/new`, `/[id]` | Owner | Yes | `work_items`, assignments, checklist snapshots, evidence, issues | Create/manage turnover | Create a turnover for the next guest changeover | Cards/tables, lifecycle/readiness integration |
| `/business/cleaners`, `/new`, `/[id]` | Owner | Yes | `workers`, invitations, assignments | Add cleaner / copy invitation | Add the cleaner or contractor you already work with | Atomic creation, duplicate and validation coverage |
| `/business/issues` | Owner | Yes | Unresolved `operational_issues` | Open turnover | No open issues | Responsive list, blocking state |
| `/business/activity` | Owner | Yes | Structured `activity_events` | Open related record | No activity yet | Responsive timeline |
| `/business/settings` | Owner | Yes | Member profile and real workspace/property defaults | Save settings | Not applicable | Useful controls only; no integrations placeholder |
| `/invite/[token]` | Cleaner | Token + auth to accept | Hashed, expiring `worker_invitations` | Confirm name and accept | Invalid/expired state | Mobile-first, revocation/expiry integration |
| `/cleaner/today`, `/upcoming`, `/completed`, `/profile` | Cleaner | Yes | Only the authenticated worker’s assignments | Open turnover | Schedule-specific compact state | Mobile navigation, RLS isolation |
| `/cleaner/turnovers/[id]` | Cleaner | Accepted assignment for sensitive data | Work item, checklist, evidence and issues | Progress/submit completion | Not applicable | Mobile task flow, upload pending/error, lifecycle integration |
| `/admin`, `/accounts`, `/cleaners`, `/turnovers/**`, `/issues`, `/activity`, `/properties/**` | Admin | Admin allow-list | Support inspection and audited controls | Inspect/support | Factual compact states | Protected server rendering; legacy dispatch routes redirected |
| Unknown routes | All | No | App Router not-found | Return home | Useful 404 | Desktop/mobile Playwright |

Legacy public, owner and admin redirect destinations and deprecation decisions are
documented in `docs/str-v1-redirect-map.md`.
