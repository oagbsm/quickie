# Quickola marketplace sandbox

This is a local/staging-only runbook for the marketplace lifecycle. It does not use `quickola.co.uk` production state and does not delete Stripe objects.

## 1. Create an isolated target

Create a separate Supabase project for staging/local testing and a Stripe platform account/test environment. Do not use the repository's currently linked Supabase project (`mmwysvsyqcjcckiwhpfq`). Configure OAuth callback URLs for the sandbox origin if Google authentication is enabled.

Copy `.env.test.example` to `.env.test` for local testing or `.env.staging.example` for staging. Fill in only the separate Supabase project credentials and Stripe `sk_test_`/`pk_test_` values. Never commit either file.

Required safety settings are `QUICKOLA_SANDBOX=true`, a localhost or `staging.quickola.co.uk` site URL, a non-production Supabase URL, and a Stripe test secret. Sandbox commands fail closed otherwise.

## Using the existing production Supabase database for sandbox fixtures

This is less isolated than a separate Supabase project and should be used only deliberately. The sandbox guard accepts the existing project only when both flags are set:

```sh
QUICKOLA_SANDBOX=true
QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX=true
```

Stripe must still use `sk_test_`; live Stripe keys are never accepted. The command prints a warning before connecting. `sandbox:seed` writes only the exact deterministic sandbox users, provider profile, service/area rows, admin fixture, and fixed-token tagged job. `sandbox:reset --dry-run` lists the exact tagged entities first. A real reset against this database additionally requires:

```sh
QUICKOLA_SANDBOX_RESET_CONFIRM=DELETE_SANDBOX_FIXTURES_ONLY npm run sandbox:reset
```

Reset uses fixture-specific IDs/markers and never truncates, resets the schema, deletes unmarked rows, deletes storage buckets, or calls Stripe deletion APIs. If a related row cannot be conclusively tied to the fixture, it is retained. Review the dry-run output before any real reset.

## 2. Apply the schema

Install the Supabase CLI separately if needed, link it to the sandbox project, and inspect its version with `supabase --help`/`supabase --version`. Apply the repository migrations to the sandbox only. In a local Supabase installation, use the documented local migration command. Do not run migration commands while `.env.test` points at the production project.

The chain includes the booking safety migrations `202609040005_marketplace_booking_operations_safety.sql` and `202609040006_marketplace_completion_review_safety.sql`.

## 3. Check and seed fixtures

```sh
cp .env.test.example .env.test
# edit .env.test with isolated credentials and a real test Connect account ID
npm run sandbox:check
npm run sandbox:seed
```

The seed creates/reuses tagged accounts:

- `customer+sandbox@quickola.test`
- `provider+sandbox@quickola.test`
- `admin+sandbox@quickola.test`

It creates an approved, service/area-matched provider and a tagged pressure-washing job. `SANDBOX_STRIPE_CONNECTED_ACCOUNT_ID` must be a Stripe test-mode connected account; the script never invents a payout account.

## 4. Run the app and Stripe webhooks

```sh
npm run dev
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Put the Stripe CLI's generated `whsec_...` in the local `STRIPE_WEBHOOK_SECRET`. Do not copy it to production. Use an official Stripe test card such as `4242 4242 4242 4242` with any future expiry and CVC.

The current provider login uses Google OAuth. For a fully automated provider run, configure a sandbox OAuth client or use a pre-authenticated test browser context; do not add a production bypass or expose service-role credentials to Playwright.

## 5. Lifecycle scenario runner

`npm run sandbox:scenarios -- --dry-run` validates the sandbox guard and prints the complete lifecycle scenario plan without writing to Supabase or calling Stripe. It is the safe default.

The runner is intentionally fail-closed until isolated fixture orchestration is configured. Supplying `--execute` does not enable writes by itself; it additionally requires `QUICKOLA_SCENARIO_EXECUTION_CONFIRM=RUN_SANDBOX_SCENARIOS_ONLY`, both sandbox/production-override flags, test Stripe credentials, and a localhost/staging site URL.

## 6. Lifecycle checks

The normal manual run is:

1. Customer opens the seeded job.
2. Provider submits a matching offer.
3. Customer chooses it and completes Stripe Checkout.
4. The verified webhook changes the booking to paid/booked.
5. Provider advances the job to `awaiting_customer_completion`.
6. Customer confirms with a 1–5 rating.
7. The atomic RPC creates the review and completes the booking.
8. The payout guard permits one idempotent Stripe test transfer.

For the dispute run, report a problem with a reason instead. Confirm the dispute row and payout hold, resolve it for the customer in the admin console, then issue the bounded Stripe test refund. Payout must remain blocked.

## 7. Reset only fixture data

```sh
npm run sandbox:reset
```

Reset requires the same guards and removes only tagged sandbox jobs, their marketplace children, sandbox provider/customer records, and the three sandbox auth users. It does not delete storage buckets or call Stripe deletion APIs. Review the output and Stripe dashboard separately for orphaned test files/objects.

## 8. Playwright and staging

```sh
npm run test:e2e
```

The E2E projects use localhost port 3108. The suites are opt-in with `QUICKOLA_E2E_ENABLED=true` and must use sandbox credentials only. Configure staging with `.env.staging.example`, a staging Supabase project, Stripe test keys, staging OAuth callbacks, and a staging Stripe webhook endpoint. Do not deploy automatically or change production DNS.

## 9. Moving toward production

Run the complete lifecycle against sandbox first, including webhook replay, duplicate completion, duplicate refund, dispute, and transfer checks. Then review every environment variable, webhook endpoint, OAuth callback, RLS policy, and migration against the production change plan. Production Stripe keys and production URLs must never be accepted by these sandbox commands.
