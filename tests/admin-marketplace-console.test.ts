import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const dashboard = read("app/admin/(portal)/page.tsx");
const nav = read("app/admin/components/AdminNav.tsx");
const jobs = read("app/admin/(portal)/jobs/page.tsx");
const jobDetail = read("app/admin/(portal)/jobs/[id]/page.tsx");
const providers = read("app/admin/(portal)/providers/page.tsx");
const payments = read("app/admin/(portal)/payments/page.tsx");
const customers = read("app/admin/(portal)/customers/page.tsx");

test("admin navigation is organized around marketplace operations", () => {
  assert.match(nav, /Overview/);
  assert.match(nav, /Bookings/);
  assert.match(nav, /Providers/);
  assert.match(nav, /Payments/);
  assert.match(nav, /Support/);
  assert.match(nav, /Audit log/);
  assert.doesNotMatch(nav, /Offers/);
});

test("admin overview derives action items and today's marketplace information", () => {
  assert.match(dashboard, /Needs action/);
  assert.match(dashboard, /pending_review/);
  assert.match(dashboard, /noOfferJobs/);
  assert.match(dashboard, /Marketplace today/);
  assert.match(dashboard, /Recent marketplace activity/);
  assert.match(dashboard, /Everything looks under control/);
});

test("admin marketplace views expose real job, provider, and payment state", () => {
  assert.match(jobs, /marketplace_jobs/);
  assert.match(jobs, /offers/);
  assert.match(providers, /stripe_status/);
  assert.match(providers, /provider_status/);
  assert.match(providers, /Needs review/);
  assert.match(providers, /View dossier/);
  assert.match(payments, /payment_status/);
  assert.match(payments, /platform_fee_pence/);
  assert.match(payments, /no live Stripe calls/);
});

test("customer operations use marketplace-owned records and link to dossiers", () => {
  assert.match(customers, /marketplace_customers/);
  assert.match(customers, /marketplace_bookings/);
  assert.match(customers, /marketplace_reviews/);
  assert.match(customers, /admin\/customers\/\$\{customer\.id\}/);
  assert.doesNotMatch(customers, /Offers made/);
});

test("marketplace compatibility destinations exist", () => {
  assert.match(read("app/admin/(portal)/support/page.tsx"), /messages\/page/);
  assert.match(read("app/admin/(portal)/audit/page.tsx"), /activity\/page/);
  assert.match(read("app/admin/(portal)/marketplace-bookings/page.tsx"), /marketplace_bookings/);
  assert.match(read("app/admin/(portal)/marketplace-bookings/[id]/page.tsx"), /Offer accepted \/ booking created/);
  assert.match(read("app/admin/(portal)/providers/[id]/page.tsx"), /Operational eligibility/);
});

test("admin jobs detail exposes the complete marketplace lifecycle", () => {
  assert.match(jobDetail, /marketplace_quotes/);
  assert.match(jobDetail, /marketplace_providers/);
  assert.match(jobDetail, /marketplace_provider_services/);
  assert.match(jobDetail, /marketplace_provider_service_areas/);
  assert.match(jobDetail, /marketplace_reviews/);
  assert.match(jobDetail, /Booking, payment and completion/);
  assert.match(jobDetail, /Provider review history/);
  assert.match(jobDetail, /stripe_payment_intent_id/);
  assert.match(jobDetail, /marketplace_disputes/);
  assert.match(jobDetail, /marketplace_refunds/);
  assert.match(jobDetail, /await requireAdmin\(\)/);
  assert.doesNotMatch(jobDetail, /cleaner_profiles/);
});
