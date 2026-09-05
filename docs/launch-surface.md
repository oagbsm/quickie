# Quickola launch surface

This is the canonical application surface after the second legacy cleanup.
Historical migrations and database objects are intentionally excluded from
this runtime inventory.

## Customer

- `/`, `/about`, `/contact`, `/cookies`, `/help`, `/how-it-works`
- `/create-account`, `/sign-in`, `/auth/customer`, `/auth/customer/publish`, `/auth/callback`
- `/post-job/thank-you`, `/jobs`, `/jobs/[token]`, `/my-jobs`
- `/messages`, `/messages/[conversationId]`
- `/services`, `/services/[service]`, `/services/[service]/[location]`
- `/locations`, `/locations/[location]`, `/service-area`
- `/trust-safety`, `/pricing-methodology`, `/terms`, `/privacy-policy`, `/llms.txt`

## Provider

- `/pro/login`, `/pro/register`
- `/work`, `/work/onboarding`, `/work/jobs/[id]`, `/work/offers`
- `/work/messages`, `/work/messages/[conversationId]`
- `/work/payments`, `/work/profile`
- `/provider/invite`, `/provider/invite/[token]`, `/provider/invite/accept`

## Admin

- `/admin`, `/admin/jobs`, `/admin/jobs/[id]`
- `/admin/marketplace-bookings`, `/admin/marketplace-bookings/[id]`
- `/admin/providers`, `/admin/providers/[id]`
- `/admin/customers`, `/admin/customers/[id]`, `/admin/payments`
- `/admin/support`, `/admin/audit`, `/admin/settings`

## APIs and server systems

- Marketplace messaging and quote notifications
- Address lookup
- Stripe payment and Connect webhooks
- Sandbox marketplace email endpoint, explicitly environment-gated
- Current server actions for customer jobs/payment/completion, provider work,
  onboarding/profile, admin operations, refunds, disputes, holds and transfers

## Intentional compatibility

Existing redirects remain for `/product`, `/quickola-price-index`, the
comparison page, `/privacy`, `/results`, `/provider`, and `/for-providers`.
`/admin/messages` redirects to Support and `/admin/audit` re-exports the
canonical activity log. These are compatibility mechanisms, not separate
product systems.

## Explicit exclusions

The retired Cumar APIs, unsupported `/solutions/*` marketing pages, old screen
and home-task pages, orphan Offers/Qualification admin pages, and old provider
route files are not part of the launch surface. The corresponding historical
database schema and migrations remain preserved for a separate retirement
review.
