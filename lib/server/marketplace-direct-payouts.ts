import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/server/marketplace-payments";
import { addWorkingDaysUtc } from "@/lib/marketplace/working-days";

export type DirectPayoutResult = { status: "paid" | "scheduled" | "pending_funds" | "blocked" | "failed" | "already_processing"; payoutId?: string };

/** Mark a completed direct-charge allocation for release after two working days. */
export async function scheduleDirectChargePayout(bookingId: string) {
  const admin = createSupabaseAdminClient();
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,payment_flow,payment_status,status,completion_status,completed_at,customer_completed_at,payout_hold_status").eq("id", bookingId).maybeSingle();
  if (error || !booking) throw new Error("direct_payout_booking_lookup_failed");
  if (booking.payment_flow !== "direct_charge" || booking.payment_status !== "paid" || booking.status !== "completed" || booking.completion_status !== "completed") return { status: "blocked" as const };
  const eligibleAt = addWorkingDaysUtc(booking.completed_at || booking.customer_completed_at || new Date(), 2).toISOString();
  const { data: allocation, error: allocationError } = await admin.from("marketplace_payout_allocations").select("id,payout_status").eq("booking_id", bookingId).maybeSingle();
  if (allocationError || !allocation) return { status: "blocked" as const };
  if (allocation.payout_status === "paid" || allocation.payout_status === "processing") return { status: "already_processing" as const };
  const nextStatus = booking.payout_hold_status === "held" ? "held" : "scheduled";
  const { error: updateError } = await admin.from("marketplace_payout_allocations").update({ payout_status: nextStatus, payout_eligible_at: eligibleAt, updated_at: new Date().toISOString() }).eq("id", allocation.id).in("payout_status", ["pending", "failed", "held"]);
  if (updateError) throw new Error("direct_payout_schedule_failed");
  return { status: nextStatus === "held" ? "blocked" as const : "scheduled" as const };
}

async function findExistingPayout(stripe: ReturnType<typeof getStripe>, accountId: string, bookingId: string) {
  const payouts = await stripe.payouts.list({ limit: 100 }, { stripeAccount: accountId });
  return payouts.data.find((payout) => payout.metadata?.booking_id === bookingId) || null;
}

/** Release exactly one due direct-charge allocation, never the account balance. */
export async function payoutDirectChargeBooking(bookingId: string): Promise<DirectPayoutResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,provider_id,amount_pence,currency,payment_flow,payment_status,status,completion_status,payout_hold_status,refunded_amount_pence,stripe_connected_account_id,stripe_charge_id").eq("id", bookingId).maybeSingle();
  if (error || !booking) throw new Error("direct_payout_booking_lookup_failed");
  const { data: allocation } = await admin.from("marketplace_payout_allocations").select("id,provider_id,stripe_connected_account_id,provider_net_pence,payout_status,payout_eligible_at,stripe_available_on,stripe_payout_id").eq("booking_id", bookingId).maybeSingle();
  if (!allocation || booking.payment_flow !== "direct_charge" || booking.payment_status !== "paid" || booking.status !== "completed" || booking.completion_status !== "completed" || booking.payout_hold_status === "held" || Number(booking.refunded_amount_pence || 0) > 0) return { status: "blocked" };
  if (!booking.stripe_connected_account_id || allocation.stripe_connected_account_id !== booking.stripe_connected_account_id || allocation.provider_id !== booking.provider_id || !booking.stripe_charge_id || !allocation.payout_eligible_at) return { status: "blocked" };
  if (allocation.payout_status === "paid") return { status: "paid", payoutId: allocation.stripe_payout_id || undefined };
  if (allocation.payout_status === "processing") return { status: "already_processing", payoutId: allocation.stripe_payout_id || undefined };
  if (!["scheduled", "failed", "held"].includes(allocation.payout_status) || Date.now() < new Date(allocation.payout_eligible_at).getTime() || (allocation.stripe_available_on && Date.now() < new Date(allocation.stripe_available_on).getTime())) return { status: "scheduled" };
  const stripe = getStripe();
  const provider = await admin.from("marketplace_providers").select("user_id,stripe_account_id").eq("user_id", booking.provider_id).maybeSingle();
  if (!provider.data || provider.data.stripe_account_id !== booking.stripe_connected_account_id) return { status: "blocked" };
  const { data: disputes } = await admin.from("marketplace_disputes").select("id").eq("booking_id", bookingId).in("status", ["open", "in_review", "resolved_customer"]);
  if ((disputes || []).length) return { status: "blocked" };
  const balance = await stripe.balance.retrieve({}, { stripeAccount: booking.stripe_connected_account_id });
  const available = balance.available.find((item) => item.currency === (booking.currency || "gbp"))?.amount || 0;
  const amount = Number(allocation.provider_net_pence || 0);
  if (amount <= 0) return { status: "blocked" };
  if (available < amount) return { status: "pending_funds" };
  const claimed = await admin.from("marketplace_payout_allocations").update({ payout_status: "processing", payout_initiated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", allocation.id).in("payout_status", ["scheduled", "failed", "held"]).is("stripe_payout_id", null).select("id").maybeSingle();
  if (claimed.error || !claimed.data) return { status: "already_processing" };
  try {
    const existing = await findExistingPayout(stripe, booking.stripe_connected_account_id, bookingId);
    const payout = existing || await stripe.payouts.create({ amount, currency: booking.currency || "gbp", metadata: { booking_id: bookingId, payout_allocation_id: allocation.id } }, { stripeAccount: booking.stripe_connected_account_id, idempotencyKey: `marketplace-direct-payout:${allocation.id}` });
    const terminalStatus = payout.status === "paid" ? "paid" : ["failed", "canceled"].includes(payout.status) ? "failed" : "processing";
    await admin.from("marketplace_payout_allocations").update({ payout_status: terminalStatus, stripe_payout_id: payout.id, paid_out_at: terminalStatus === "paid" ? new Date().toISOString() : null, failure_reason: terminalStatus === "failed" ? `stripe_payout_${payout.status}` : null, updated_at: new Date().toISOString() }).eq("id", allocation.id).eq("payout_status", "processing");
    return { status: terminalStatus === "paid" ? "paid" : "already_processing", payoutId: payout.id };
  } catch (error) {
    const recovered = await findExistingPayout(stripe, booking.stripe_connected_account_id, bookingId).catch(() => null);
    if (recovered) {
      await admin.from("marketplace_payout_allocations").update({ payout_status: recovered.status === "paid" ? "paid" : "processing", stripe_payout_id: recovered.id, paid_out_at: recovered.status === "paid" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", allocation.id).eq("payout_status", "processing");
      return { status: recovered.status === "paid" ? "paid" : "already_processing", payoutId: recovered.id };
    }
    await admin.from("marketplace_payout_allocations").update({ payout_status: "failed", failure_reason: error instanceof Error ? error.message.slice(0, 240) : "payout_failed", updated_at: new Date().toISOString() }).eq("id", allocation.id).eq("payout_status", "processing");
    return { status: "failed" };
  }
}
