import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const email = read("lib/marketplace/email/transactional.ts");
const postJob = read("app/post-job/actions.ts");
const workActions = read("app/work/actions.ts");
const jobsActions = read("app/jobs/actions.ts");
const customerMessages = read("app/messages/actions.ts");
const messageApi = read("app/api/marketplace/messages/route.ts");
const webhook = read("app/api/stripe/webhook/route.ts");
const adminActions = read("app/admin/actions.ts");

test("transactional email delivery is server-only and database-deduplicated", () => {
  assert.match(email, /import "server-only"/);
  assert.match(email, /marketplace_email_notifications/);
  assert.match(email, /dedupe_key: input\.dedupeKey/);
  assert.match(email, /reserveError\?\.code === "23505"/);
  assert.match(email, /RESEND_API_KEY/);
  assert.match(email, /status: "pending"/);
  assert.match(email, /status: "sent"/);
  assert.match(email, /status: "failed"/);
  assert.match(email, /resend_request_ambiguous/);
});

test("the six requested events use the authoritative marketplace paths", () => {
  assert.match(email, /first_provider_message/);
  assert.match(email, /first_customer_message/);
  assert.match(email, /first_offer/);
  assert.match(email, /new_matching_job/);
  assert.match(email, /booking_confirmed_customer/);
  assert.match(email, /booking_confirmed_provider/);
  assert.match(postJob, /notifyMatchingProvidersForJob\(job\.id\)/);
  assert.match(workActions, /notifyFirstMarketplaceOffer\(jobId\)/);
  assert.match(jobsActions, /notifyFirstMarketplaceOffer\(job\.id\)/);
  assert.match(customerMessages, /notifyFirstMarketplaceMessage\(conversationId, user\.id\)/);
  assert.match(messageApi, /notifyFirstMarketplaceMessage\(conversationId, user\.id\)/);
  assert.match(webhook, /notifyBookingPaid\(booking\.id\)/);
  assert.doesNotMatch(jobsActions, /quote_selected/);
});

test("first-offer notification validates the shared active offer statuses", () => {
  assert.match(email, /ACTIVE_MARKETPLACE_OFFER_STATUSES/);
  assert.match(email, /\.in\("status", ACTIVE_MARKETPLACE_OFFER_STATUSES\)/);
  assert.match(email, /first_offer:\$\{job\.id\}:\$\{customer\.auth_user_id\}/);
  assert.match(read("app/api/marketplace/quote-notification/route.ts"), /ACTIVE_MARKETPLACE_OFFER_STATUSES/);
});

test("booking provider resolution supports current and transitional identities", () => {
  assert.match(email, /booking\.provider_id \|\| quote\?\.bidder_user_id \|\| quote\?\.provider_id/);
  assert.match(email, /booking\.quote_id/);
  assert.match(email, /booking_confirmed_provider/);
});

test("reservation lifecycle prevents duplicate sends and isolates ambiguous attempts", () => {
  assert.match(email, /existing\?\.status === "sent"/);
  assert.match(email, /existing\?\.status === "pending"/);
  assert.match(email, /existing\?\.status === "failed"/);
  assert.match(email, /eq\("status", "pending"\)/);
  assert.match(email, /attempt_count/);
  assert.match(email, /Pending means the delivery outcome is ambiguous/);
  assert.doesNotMatch(email, /staleBefore|\.lte\("last_attempt_at"|30 \* 60 \* 1000/);
});

test("pending records cannot be reclaimed, while failed records can retry and become sent", () => {
  const pendingBlock = email.slice(email.indexOf('existing?.status === "pending"'), email.indexOf('} else if (existing?.status === "failed"'));
  const failedBlock = email.slice(email.indexOf('existing?.status === "failed"'), email.indexOf('} else {', email.indexOf('existing?.status === "failed"')));
  assert.match(pendingBlock, /return \{ status: "skipped"/);
  assert.doesNotMatch(pendingBlock, /update\(/);
  assert.match(failedBlock, /update\(/);
  assert.match(failedBlock, /status: "pending"/);
  assert.match(email, /status: "sent"/);
});

test("matching fan-out batches provider relationship queries and keeps failures isolated", () => {
  assert.match(email, /\.in\("provider_id", providerIds\)/);
  assert.match(email, /Promise\.all\(\[/);
  assert.match(email, /isMarketplaceJobMatch\(job, services \|\| \[\], areas \|\| \[\]\)/);
  assert.match(email, /marketplace_matching_email_failed/);
});

test("notification-only quote endpoint isolates email failures", () => {
  const route = read("app/api/marketplace/quote-notification/route.ts");
  assert.match(route, /try \{ await notifyFirstMarketplaceOffer/);
});

test("matching notifications reuse the provider job-board matcher and avoid private customer data", () => {
  assert.match(email, /isMarketplaceJobMatch\(job, services \|\| \[\], areas \|\| \[\]\)/);
  assert.match(email, /marketplace_provider_services/);
  assert.match(email, /marketplace_provider_service_areas/);
  assert.doesNotMatch(email, /cleaner_profiles|customer_email|customer_phone/);
});

test("booking notifications are triggered from the verified Stripe webhook, not browser success", () => {
  assert.match(webhook, /session\.payment_status !== "paid"/);
  assert.match(webhook, /payment_status: "paid"/);
  assert.match(webhook, /try \{ await notifyBookingPaid/);
});

test("completion notifications remain deduplicated and isolated from lifecycle actions", () => {
  assert.match(email, /completion_confirmation_customer/);
  assert.match(email, /completion_confirmed_provider/);
  assert.match(email, /completion_issue_provider/);
  assert.match(jobsActions, /notifyCompletionOutcome\(bookingId, "confirmed"/);
  assert.match(jobsActions, /notifyCompletionOutcome\(bookingId, "issue_reported"\)/);
  assert.match(workActions, /notifyCustomerCompletionRequest\(bookingId\)/);
});

test("provider approval email is transition-gated and isolated", () => {
  assert.match(email, /export async function sendProviderApprovedEmail\(providerId: string\)/);
  assert.match(email, /eventType: "provider_approved"/);
  assert.match(email, /dedupeKey: `provider_approved:\$\{provider\.user_id\}`/);
  assert.match(email, /subject: "You're approved to start working on Quickola"/);
  assert.match(email, /cta\(link\("\/work"\), "View available jobs"\)/);
  assert.match(email, /auth\.admin\.getUserById\(providerId\)/);
  assert.match(adminActions, /current\.provider_status !== "approved" && nextStatus === "approved"/);
  assert.match(adminActions, /if \(!history\.error && current\.provider_status !== "approved" && nextStatus === "approved"\)/);
  assert.match(adminActions, /try \{\s*await sendProviderApprovedEmail\(providerId\);/);
  assert.match(adminActions, /marketplace_provider_approval_email_failed/);
  assert.match(adminActions, /marketplace_provider_status_history.*insert/);
});
