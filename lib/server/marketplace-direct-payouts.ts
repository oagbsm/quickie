import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateMarketplacePlatformFeePence, getStripe } from "@/lib/server/marketplace-payments";

export type DirectPayoutResult = { status: "paid" | "blocked" | "failed" | "already_processing"; payoutId?: string };

/** Pay only the attributable net amount for one completed direct-charge booking. */
export async function payoutDirectChargeBooking(bookingId: string): Promise<DirectPayoutResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,job_id,provider_id,amount_pence,currency,payment_flow,payment_status,status,completion_status,payout_hold_status,refunded_amount_pence,stripe_connected_account_id,stripe_charge_id,stripe_application_fee_id").eq("id", bookingId).maybeSingle();
  if (error) throw new Error("direct_payout_booking_lookup_failed");
  if (!booking) throw new Error("booking_not_found");
  if (booking.payment_flow !== "direct_charge" || booking.payment_status !== "paid" || booking.status !== "completed" || booking.completion_status !== "completed" || booking.payout_hold_status === "held") return { status: "blocked" };
  if (!booking.stripe_connected_account_id || !booking.stripe_charge_id) return { status: "blocked" };

  const existing = await admin.from("marketplace_payout_allocations").select("id,payout_status,stripe_payout_id").eq("booking_id", booking.id).maybeSingle();
  if (existing.data?.payout_status === "paid") return { status: "paid", payoutId: existing.data.stripe_payout_id || undefined };
  if (existing.data?.payout_status === "processing") return { status: "already_processing" };

  const stripe = getStripe();
  const charge = await stripe.charges.retrieve(booking.stripe_charge_id, { expand: ["balance_transaction"] }, { stripeAccount: booking.stripe_connected_account_id });
  const balanceTransaction = typeof charge.balance_transaction === "string" ? null : charge.balance_transaction;
  const stripeFee = balanceTransaction?.fee_details?.filter((item) => item.type === "stripe_fee").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (stripeFee === undefined) return { status: "blocked" };
  const grossAmount = Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0);
  const quickolaFee = calculateMarketplacePlatformFeePence(grossAmount);
  const providerNet = grossAmount - quickolaFee - stripeFee;
  if (providerNet <= 0) return { status: "blocked" };

  const allocation = await admin.from("marketplace_payout_allocations").insert({ booking_id: booking.id, provider_id: booking.provider_id, stripe_connected_account_id: booking.stripe_connected_account_id, gross_amount_pence: grossAmount, quickola_fee_pence: quickolaFee, stripe_fee_pence: stripeFee, provider_net_pence: providerNet }).select("id").maybeSingle();
  if (allocation.error?.code === "23505") return { status: "already_processing" };
  if (allocation.error || !allocation.data) throw new Error("direct_payout_allocation_failed");
  const claimed = await admin.from("marketplace_payout_allocations").update({ payout_status: "processing", updated_at: new Date().toISOString() }).eq("id", allocation.data.id).eq("payout_status", "pending").select("id").maybeSingle();
  if (claimed.error || !claimed.data) return { status: "already_processing" };

  try {
    const payout = await stripe.payouts.create({ amount: providerNet, currency: booking.currency || "gbp", metadata: { booking_id: booking.id, payout_allocation_id: allocation.data.id } }, { stripeAccount: booking.stripe_connected_account_id, idempotencyKey: `marketplace-direct-payout:${allocation.data.id}` });
    const persisted = await admin.from("marketplace_payout_allocations").update({ payout_status: payout.status === "paid" ? "paid" : "processing", stripe_payout_id: payout.id, paid_out_at: payout.status === "paid" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", allocation.data.id).eq("payout_status", "processing").select("id").maybeSingle();
    return persisted.data ? (payout.status === "paid" ? { status: "paid", payoutId: payout.id } : { status: "already_processing", payoutId: payout.id }) : { status: "already_processing", payoutId: payout.id };
  } catch (error) {
    await admin.from("marketplace_payout_allocations").update({ payout_status: "failed", failure_reason: error instanceof Error ? error.message.slice(0, 240) : "payout_failed", updated_at: new Date().toISOString() }).eq("id", allocation.data.id).eq("payout_status", "processing");
    return { status: "failed" };
  }
}
