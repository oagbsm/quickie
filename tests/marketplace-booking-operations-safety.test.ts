import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202609040005_marketplace_booking_operations_safety.sql");
const webhook = read("app/api/stripe/webhook/route.ts");
const refunds = read("lib/server/marketplace-refunds.ts");
const transfers = read("lib/server/marketplace-transfers.ts");
const adminActions = read("app/admin/actions.ts");
const jobActions = read("app/jobs/actions.ts");
const bookingAdminPage = read("app/admin/(portal)/marketplace-bookings/[id]/page.tsx");
const disputeResolutionMigration = read("supabase/migrations/20260905100000_marketplace_dispute_resolution_outcomes.sql");
const providerJobPage = read("app/work/jobs/[id]/page.tsx");
const providerPaymentsPage = read("app/work/payments/page.tsx");
const customerState = read("lib/marketplace/customer-job-state.ts");
const money = read("lib/marketplace/money.ts");
const customerJobPage = read("app/jobs/[token]/page.tsx");
const forceSettlementMigration = read("supabase/migrations/20260905210000_marketplace_partial_refund_force_settlement.sql");
const forceSettlementForm = read("app/admin/(portal)/marketplace-bookings/ForceSettlementForm.tsx");

test("Stripe webhook events are uniquely claimed and retryable after failure", () => {
  assert.match(migration, /stripe_event_id text not null unique/);
  assert.match(migration, /claim_stripe_webhook_event/);
  assert.match(migration, /on conflict \(stripe_event_id\) do nothing/);
  assert.match(migration, /status = 'failed'/);
  assert.match(webhook, /claim_stripe_webhook_event/);
  assert.match(webhook, /duplicate_processing/);
  assert.match(webhook, /status: "processed"/);
});

test("refunds are reserved, bounded, Stripe-idempotent, and persisted", () => {
  assert.match(migration, /marketplace_refunds/);
  assert.match(migration, /stripe_refund_id text unique/);
  assert.match(migration, /marketplace_refunds_one_pending_idx/);
  assert.match(refunds, /refunded_amount_pence/);
  assert.match(refunds, /refund_amount_invalid/);
  assert.match(refunds, /marketplace-refund:\$\{inserted\.data\.id\}/);
  assert.match(refunds, /refunds\.create/);
  assert.match(adminActions, /issueMarketplaceBookingRefund/);
});

test("cancellation and disputes are server-authoritative and hold payout", () => {
  assert.match(migration, /cancel_marketplace_booking/);
  assert.match(migration, /cancellation_reason_required/);
  assert.match(migration, /booking_not_cancellable/);
  assert.match(migration, /payout_hold_status = 'held'/);
  assert.match(migration, /open_marketplace_dispute/);
  assert.match(migration, /marketplace_disputes_one_active_per_booking_idx/);
  assert.match(migration, /unresolved_dispute/);
  assert.match(adminActions, /cancelMarketplaceBookingAsAdmin/);
  assert.match(adminActions, /resolveMarketplaceDispute/);
});

test("provider payout is blocked by cancellation, refund, or operational hold", () => {
  assert.match(transfers, /payout_hold_status === "held"/);
  assert.match(transfers, /refunded_amount_pence/);
  assert.match(transfers, /payment_status === "paid"/);
  assert.match(transfers, /marketplace-provider-transfer:\$\{booking\.id\}/);
  assert.match(transfers, /marketplace_disputes/);
  assert.match(transfers, /booking_dispute_lookup_failed/);
  assert.match(transfers, /pendingRefund/);
  assert.match(transfers, /calculateProviderEarnings/);
});

test("transfer lookup failures retain bounded internal Supabase diagnostics", () => {
  assert.match(transfers, /logSupabaseTransferLookupFailure/);
  assert.match(transfers, /"booking_lookup"/);
  assert.match(transfers, /supabaseCode/);
  assert.match(transfers, /\.slice\(0, 200\)/);
  assert.match(transfers, /booking_transfer_lookup_failed/);
});

test("partial refunds recalculate the transfer and prevent refund/transfer overlap", () => {
  assert.match(transfers, /partially_refunded/);
  assert.match(transfers, /earnings\.providerEarningsPence/);
  assert.match(refunds, /refund_after_transfer_not_supported/);
  assert.match(read("supabase/migrations/20260905074615_marketplace_transfer_refund_safety.sql"), /paid_transfer_fields_check/);
});

test("refund policy uses integer GBP parsing and exposes partial refund state", () => {
  assert.match(money, /pence = Number\(pounds\) \* 100/);
  assert.match(money, /Number\.isSafeInteger\(pence\)/);
  assert.match(adminActions, /parseGbpToPence/);
  assert.match(bookingAdminPage, /Remaining refundable/);
  assert.match(bookingAdminPage, /RefundForm/);
  assert.match(customerState, /partially_refunded/);
  assert.match(customerJobPage, /Partial refund issued/);
  assert.match(providerJobPage, /Partial refund issued/);
});

test("partial-refund UI preserves paid booking semantics across surfaces", () => {
  assert.match(customerJobPage, /getMarketplacePaymentState\(acceptedBooking\) === "paid"/);
  assert.match(customerJobPage, /paymentLocked=\{getMarketplacePaymentState\(acceptedBooking\) === "paid"\}/);
  assert.match(customerJobPage, /isPartialMarketplaceRefund/);
  assert.match(bookingAdminPage, /getMarketplaceBookingLifecycleState/);
  assert.match(providerJobPage, /getMarketplacePaymentState\(providerBooking\) === "paid"/);
  assert.match(providerJobPage, /Issue being reviewed/);
  assert.match(providerPaymentsPage, /Refunds have been reflected in the amounts shown above/);
  assert.match(providerPaymentsPage, /earnings\.providerEarningsPence/);
});

test("refunds never proceed after a successful provider transfer and indeterminate Stripe results stay pending", () => {
  assert.match(refunds, /refund_after_transfer_not_supported/);
  assert.match(refunds, /indeterminate/);
  assert.match(refunds, /status: indeterminate \? "already_processing" : "failed"/);
  assert.match(refunds, /provider_transfer_status: "blocked"/);
});

test("ambiguous provider transfers reconcile from Stripe without unsafe recreation", () => {
  assert.match(transfers, /reconcileMarketplaceProviderTransfer/);
  assert.match(transfers, /transfers\.list/);
  assert.match(transfers, /if \(!matching\) return \{ status: "already_processing" \}/);
  assert.match(adminActions, /reconcileMarketplaceBookingTransfer/);
});

test("completion review is atomic and problem reports require the protected dispute path", () => {
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /add column if not exists completed_at/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /payout_hold_status = 'held'/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /review_already_submitted/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /marketplace_disputes/);
  assert.match(jobActions, /reason_text: reasonText/);
  assert.match(jobActions, /reportMarketplaceCompletionIssue/);
});

test("refund persistence failures do not convert an ambiguous Stripe result into a second attempt", () => {
  assert.match(refunds, /stage: "refund_record_persist"/);
  assert.match(refunds, /stage: "booking_state_persist"/);
  assert.match(refunds, /status: "already_processing", refundId: refund\.id/);
});

test("failed provider transfers have one admin-only, confirmed retry entry point", () => {
  assert.match(adminActions, /retryMarketplaceProviderTransfer/);
  assert.match(adminActions, /await requireAdmin\(\)/);
  assert.match(adminActions, /provider_transfer_status !== "failed"/);
  assert.match(adminActions, /definitiveFailureCodes/);
  assert.match(adminActions, /provider_transfer_error/);
  assert.match(adminActions, /booking\.stripe_transfer_id/);
  const retryAction = adminActions.slice(adminActions.indexOf("export async function retryMarketplaceProviderTransfer"), adminActions.indexOf("export async function cancelMarketplaceBookingAsAdmin"));
  assert.equal((retryAction.match(/transferMarketplaceProviderFunds\(bookingId\)/g) || []).length, 1);
  assert.match(bookingAdminPage, /booking\.provider_transfer_status === "failed"/);
  const retryForm = read("app/admin/(portal)/marketplace-bookings/RetryPayoutForm.tsx");
  assert.match(retryForm, /Retry payout/);
  assert.match(retryForm, /Retry .*payout to this provider/);
  assert.match(retryForm, /PendingButton/);
});

test("provider transfer attempts rotate only after definitive failures", () => {
  const attemptsMigration = read("supabase/migrations/20260905090000_marketplace_transfer_attempts.sql");
  assert.match(attemptsMigration, /provider_transfer_attempt integer not null default 0/);
  assert.match(transfers, /provider_transfer_attempt/);
  assert.match(transfers, /const currentAttempt/);
  assert.match(transfers, /const nextAttempt = currentAttempt \+ 1/);
  assert.match(transfers, /marketplace-provider-transfer:\$\{booking\.id\}:\$\{nextAttempt\}/);
  assert.match(transfers, /if \(booking\.provider_transfer_status === "processing"\) return \{ status: "already_processing" \}/);
  assert.match(transfers, /\.eq\("provider_transfer_attempt", currentAttempt\)/);
  assert.match(transfers, /stripe_balance_insufficient/);
  assert.match(transfers, /stripe_transfer_indeterminate/);
  assert.match(transfers, /stripe\.transfers\.list/);
  assert.match(transfers, /const existingTransfer/);
  assert.ok(transfers.indexOf("const existingTransfer") < transfers.indexOf("stripe.transfers.create"));
  assert.match(transfers, /provider_transfer_status: "paid"/);
  assert.match(transfers, /provider_transfer_status: "processing"/);
  assert.match(transfers, /status: "already_processing"/);
  assert.match(adminActions, /provider_transfer_status !== "failed"/);
  assert.match(adminActions, /booking\.stripe_transfer_id/);
  assert.doesNotMatch(bookingAdminPage, /Check Stripe platform/);
});

test("dispute resolution has explicit continue and refund outcomes", () => {
  assert.match(disputeResolutionMigration, /resolution_status not in \('resolved_provider', 'resolved_customer'\)/);
  assert.match(disputeResolutionMigration, /completion_status = 'awaiting_customer_completion'/);
  assert.match(disputeResolutionMigration, /status = 'awaiting_customer_completion'/);
  assert.match(disputeResolutionMigration, /payout_hold_reason = 'unresolved_dispute'/);
  assert.match(disputeResolutionMigration, /provider_transfer_status = case[\s\S]*then 'pending'/);
  assert.match(disputeResolutionMigration, /payment_status = case when payment_status = 'paid' then 'refund_pending'/);
  assert.match(disputeResolutionMigration, /provider_transfer_status = 'blocked'/);
  assert.match(adminActions, /resolutionChoice === "continue"/);
  assert.match(adminActions, /resolutionChoice === "refund"/);
  assert.match(adminActions, /issueMarketplaceRefund\(booking\.id/);
  assert.match(bookingAdminPage, /ResolveDisputeForm/);
});

test("open completion issues are consistent across customer and provider surfaces", () => {
  assert.match(customerState, /completion_status === "issue_reported"/);
  assert.match(customerState, /refund_pending/);
  assert.match(customerState, /refunded/);
  assert.match(providerJobPage, /issueBeingReviewed/);
  assert.match(providerJobPage, /Issue being reviewed/);
  assert.match(providerJobPage, /Customer reported an issue/);
  assert.match(read("app/admin/(portal)/marketplace-bookings/page.tsx"), /issue_being_reviewed/);
});

test("dispute resolution never invokes provider transfer", () => {
  const resolutionAction = adminActions.slice(adminActions.indexOf("export async function resolveMarketplaceDispute"));
  assert.doesNotMatch(resolutionAction, /transferMarketplaceProviderFunds/);
  assert.match(resolutionAction, /issueMarketplaceRefund/);
  assert.match(resolutionAction, /refundStatus === "already_processing"/);
});

test("refund completion resolves disputes only after refund success", () => {
  const refundOrderMigration = read("supabase/migrations/20260905160000_fix_dispute_refund_order.sql");
  assert.match(adminActions, /dispute_lookup_after_refund/);
  assert.match(adminActions, /dispute_resolution_after_refund/);
  assert.match(refundOrderMigration, /payment_status in \('cancelled', 'refund_pending'\)/);
  assert.match(refundOrderMigration, /status = 'resolved_customer'/);
});

test("admin dispute continuation validates the RPC result and persisted state before success redirect", () => {
  assert.match(adminActions, /\[marketplace-dispute-resolution\]/);
  assert.match(adminActions, /preflight_dispute_lookup/);
  assert.match(adminActions, /resolve_marketplace_dispute/);
  assert.match(adminActions, /p_resolution_status: resolutionStatus/);
  assert.match(adminActions, /p_resolution_code: resolutionChoice/);
  assert.match(adminActions, /p_resolution_notes: resolutionNotes/);
  assert.doesNotMatch(adminActions, /\{ target_dispute: disputeId, resolution_status:/);
  assert.match(adminActions, /firstRpcRow/);
  assert.match(adminActions, /rpc_result_validation/);
  assert.match(adminActions, /persisted_state_validation/);
  assert.match(adminActions, /status === "resolved_provider"/);
  assert.match(adminActions, /completion_status === "awaiting_customer_completion"/);
  assert.match(adminActions, /payout_hold_reason !== "unresolved_dispute"/);
  assert.match(adminActions, /\["paid", "partially_refunded"\]\.includes\(booking\.payment_status/);
  assert.match(adminActions, /refunded_amount_pence === beforeBooking\.data\.refunded_amount_pence/);
  assert.match(adminActions, /error=dispute/);
  assert.match(disputeResolutionMigration, /where d\.id = target_dispute and d\.status in \('open', 'in_review'\)/);
});

test("admin hold controls distinguish dispute holds from manual holds", () => {
  assert.match(customerState, /isDisputeControlledPayoutHold/);
  assert.match(bookingAdminPage, /disputeControlledHold/);
  assert.match(bookingAdminPage, /payout_hold_status === "none"/);
  assert.match(bookingAdminPage, /This payout hold is controlled by an open customer issue/);
  assert.match(bookingAdminPage, /Resolve the issue below to release it/);
  assert.match(migration, /payout_dispute_blocked/);
});

test("partial-refund dispute continuation does not transfer funds and preserves refund state", () => {
  assert.doesNotMatch(adminActions.slice(adminActions.indexOf("export async function resolveMarketplaceDispute")), /transferMarketplaceProviderFunds/);
  assert.match(adminActions, /refunded_amount_pence === beforeBooking\.data\.refunded_amount_pence/);
  assert.match(transfers, /calculateProviderEarnings/);
  assert.match(providerJobPage, /Partial refund issued/);
});

test("partial-refund continue makes the booking completion-eligible without releasing funds", () => {
  const rpcFix = read("supabase/migrations/20260905170000_fix_partial_refund_dispute_continue.sql");
  assert.match(rpcFix, /payment_status not in \('paid', 'partially_refunded'\)/);
  assert.match(rpcFix, /customer_issue_reported', 'customer_refund_pending/);
  assert.match(rpcFix, /provider_transfer_status.*then 'pending'/);
  assert.match(rpcFix, /completion_status = 'awaiting_customer_completion'/);
  assert.match(rpcFix, /payout_hold_reason.*then null/);
  assert.doesNotMatch(rpcFix, /transferMarketplaceProviderFunds|stripe\.transfers/);
});

test("force settlement is admin-only, partial-refund-only, audited, and transfers once after persistence", () => {
  assert.match(adminActions, /export async function forceSettleMarketplacePartialRefund/);
  assert.match(adminActions, /settlementNote/);
  assert.match(adminActions, /force_settle_marketplace_partial_refund/);
  assert.match(adminActions, /marketplace_partial_refund_force_settlement/);
  assert.match(adminActions, /transferMarketplaceProviderFunds\(bookingId\)/);
  assert.match(bookingAdminPage, /forceSettlementEligible/);
  assert.match(bookingAdminPage, /ForceSettlementForm/);
  assert.match(forceSettlementForm, /window\.confirm/);
  assert.match(forceSettlementForm, /settlement reason/i);
  assert.match(forceSettlementMigration, /is_quickola_admin/);
  assert.match(forceSettlementMigration, /partial_refund_required/);
  assert.match(forceSettlementMigration, /admin_force_provider_settlement/);
  assert.match(forceSettlementMigration, /status = 'completed'/);
  assert.match(forceSettlementMigration, /completion_status = 'completed'/);
  assert.match(forceSettlementMigration, /payout_hold_status = 'none'/);
  assert.match(forceSettlementMigration, /provider_transfer_status = case when provider_transfer_status = 'blocked' then 'pending'/);
  assert.match(forceSettlementMigration, /resolution_notes = trim\(settlement_note\)/);
  assert.doesNotMatch(forceSettlementMigration, /stripe\.transfers|issueMarketplaceRefund|transferMarketplaceProviderFunds/);
});

test("force settlement blocks successful, fully refunded, unpaid, and unrelated-hold bookings", () => {
  assert.match(adminActions, /before\.provider_transfer_status !== "paid"/);
  assert.match(adminActions, /!before\.stripe_transfer_id/);
  assert.match(adminActions, /before\.payout_hold_status === "held"/);
  assert.match(adminActions, /unresolved_dispute.*customer_issue_reported.*customer_resolution_refund/);
  assert.match(forceSettlementMigration, /provider_transfer_already_paid/);
  assert.match(forceSettlementMigration, /booking_not_paid/);
  assert.match(forceSettlementMigration, /unrelated_payout_hold/);
  assert.match(forceSettlementMigration, /coalesce\(current_booking\.refunded_amount_pence, 0\) >=/);
});

test("deployed dispute RPC migration removes PL/pgSQL parameter ambiguity without changing outcomes", () => {
  const rpcFix = read("supabase/migrations/20260905143000_fix_marketplace_dispute_resolution_rpc.sql");
  assert.match(rpcFix, /drop function if exists public\.resolve_marketplace_dispute/);
  assert.match(rpcFix, /p_resolution_status text/);
  assert.match(rpcFix, /p_resolution_code text/);
  assert.match(rpcFix, /p_resolution_notes text/);
  assert.doesNotMatch(rpcFix, /trim\(resolution_code\)/);
  assert.match(rpcFix, /status = 'resolved_provider'/);
  assert.match(rpcFix, /completion_status = 'awaiting_customer_completion'/);
  assert.match(rpcFix, /payout_hold_reason = case/);
  assert.match(rpcFix, /payment_status = case when current_booking\.payment_status = 'paid' then 'refund_pending'/);
  assert.match(rpcFix, /provider_transfer_status = 'blocked'/);
});
