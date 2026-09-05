import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { expansionReadiness, isGenuineBooking, moneyPence, outcodeOf, overviewMetrics, percent } from "../lib/marketplace/admin-overview.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const dashboard = read("app/admin/(portal)/page.tsx");
const nav = read("app/admin/components/AdminNav.tsx");
const jobs = read("app/admin/(portal)/jobs/page.tsx");
const jobDetail = read("app/admin/(portal)/jobs/[id]/page.tsx");
const providers = read("app/admin/(portal)/providers/page.tsx");
const payments = read("app/admin/(portal)/payments/page.tsx");
const customers = read("app/admin/(portal)/customers/page.tsx");
const customerDossier = read("app/admin/(portal)/customers/[id]/page.tsx");

test("admin navigation is organized around marketplace operations", () => {
  assert.match(nav, /Overview/);
  assert.match(nav, /Bookings/);
  assert.match(nav, /Providers/);
  assert.match(nav, /Payments/);
  assert.match(nav, /Support/);
  assert.match(nav, /Audit log/);
  assert.doesNotMatch(nav, /Offers/);
});

test("admin overview is an operational marketplace dashboard", () => {
  assert.match(dashboard, /Today’s bookings/);
  assert.match(dashboard, /Received ≥1 quote/);
  assert.match(dashboard, /Customer paid value/);
  assert.match(dashboard, /Jobs with issues/);
  assert.match(dashboard, /Outcode expansion readiness/);
  assert.match(dashboard, /Recent activity/);
  assert.match(dashboard, /Needs attention/);
  assert.match(dashboard, /unquoted >24h/);
  assert.match(dashboard, /failed payouts/);
  assert.match(dashboard, /pendingApprovals/);
  assert.match(dashboard, /Trailing 30 days/);
  assert.match(dashboard, /No open customer issues/);
  assert.match(dashboard, /No reviews yet/);
});

test("admin overview separates strategic and operational time windows", () => {
  assert.match(dashboard, /ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS/);
  assert.match(dashboard, /selectedRange === "today"/);
  assert.match(dashboard, /const strategicFrom/);
  assert.match(dashboard, /days === 1/);
  assert.match(dashboard, /Eligible providers in/);
  assert.match(dashboard, /selectedOutcode === "all" && <OutcodeTable/);
});

test("admin overview keeps partial refunds paid and excludes unpaid/cancelled bookings", () => {
  const from = new Date("2026-09-01T00:00:00Z");
  const to = new Date("2026-10-01T00:00:00Z");
  const jobs = [
    { id: "job-1", service: "plumbing", service_subtype: "drain-unblocking", postcode: "SL6 1AA", created_at: "2026-09-05T10:00:00Z" },
    { id: "job-2", service: "plumbing", service_subtype: "leak-fixing", postcode: "SL6 2AA", created_at: "2026-09-05T10:00:00Z" },
  ];
  const metrics = overviewMetrics({ jobs, quotes: [{ job_id: "job-1", status: "submitted", created_at: "2026-09-05T11:00:00Z" }], bookings: [
    { id: "paid-partial", job_id: "job-1", amount_pence: 26600, refunded_amount_pence: 5000, payment_status: "paid", status: "booked", created_at: "2026-09-05T12:00:00Z" },
    { id: "unpaid", job_id: "job-2", amount_pence: 10000, payment_status: "pending_payment", status: "awaiting_booking_fee", created_at: "2026-09-05T12:00:00Z" },
  ], disputes: [], reviews: [], providers: [], from, to });
  assert.equal(metrics.genuineBookings.length, 1);
  assert.equal(metrics.gmv, 21600);
  assert.equal(metrics.revenue, 2160);
  assert.equal(moneyPence(metrics.gmv), "£216.00");
  assert.equal(percent(metrics.genuineBookings.length, metrics.periodJobs.length), "50%");
  assert.equal(isGenuineBooking({ id: "cancelled", job_id: "job-1", amount_pence: 100, payment_status: "paid", status: "cancelled", created_at: "2026-09-05T12:00:00Z" }), false);
});

test("admin overview derives outcodes, readiness thresholds and safe empty percentages", () => {
  assert.equal(outcodeOf(" sl6 1aa "), "SL6");
  assert.equal(outcodeOf(null), "Unknown");
  assert.equal(percent(0, 0), "0%");
  const from = new Date("2026-09-01T00:00:00Z");
  const to = new Date("2026-10-01T00:00:00Z");
  const metrics = overviewMetrics({ jobs: [], quotes: [], bookings: [], disputes: [], reviews: [], providers: [], from, to });
  assert.equal(metrics.averageRating, null);
  assert.equal(expansionReadiness(metrics, "SL6").passed, 0);
  assert.equal(expansionReadiness(metrics, "SL6").status, "EARLY");
});

test("admin marketplace views expose real job, provider, and payment state", () => {
  assert.match(jobs, /marketplace_jobs/);
  assert.match(jobs, /offers/);
  assert.match(providers, /stripe_status/);
  assert.match(providers, /provider_status/);
  assert.match(providers, /Needs attention/);
  assert.match(providers, /ServiceCombobox/);
  assert.match(providers, /10 eligible/);
  assert.match(providers, /more needed/);
  assert.match(providers, /getMarketplaceJobDisplayTitle/);
  assert.doesNotMatch(providers, /NEED MORE SUPPLY/);
  assert.match(providers, /View dossier/);
  assert.match(payments, /payment_status/);
  assert.match(payments, /platform_fee_pence/);
  assert.match(payments, /no live Stripe calls/);
});

test("admin sidebar uses the calmer grouped navigation and coherent icon set", () => {
  const layout = read("app/admin/(portal)/layout.tsx");
  assert.match(nav, /FINANCE/);
  assert.match(nav, /<svg/);
  assert.doesNotMatch(nav, /▦|♧|♙/);
  assert.match(layout, /lg:grid-cols-\[228px_1fr\]/);
  assert.match(layout, /bg-\[#0b294b\]/);
});

test("customer operations use marketplace-owned records and link to dossiers", () => {
  assert.match(customers, /marketplace_customers/);
  assert.match(customers, /marketplace_bookings/);
  assert.match(customers, /marketplace_reviews/);
  assert.match(customers, /admin\/customers\/\$\{row\.customer\.id\}/);
  assert.doesNotMatch(customers, /Offers made/);
  assert.match(customers, /Repeat customers/);
  assert.match(customers, /Customer health/);
  assert.match(customers, /riskReasons/);
  assert.match(customers, /relativeDateLabel/);
  assert.match(customers, /profile_photo_url/);
  assert.match(customers, /Rebooking opportunities/);
  assert.match(customers, /ServiceCombobox/);
  assert.doesNotMatch(customers, />Active<\/span>/);
  assert.match(customerDossier, /Providers used/);
  assert.match(customerDossier, /Booking history/);
  assert.match(customerDossier, /Reviews given/);
  assert.match(customerDossier, /Issues/);
  assert.match(customerDossier, /Refunds/);
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
