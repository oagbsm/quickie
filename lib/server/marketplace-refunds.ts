import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type MarketplaceRefundResult = { status: "succeeded" | "failed" | "already_processing"; refundId?: string };

export async function issueMarketplaceRefund(bookingId: string, amountPence: number, reason: string, adminUserId: string): Promise<MarketplaceRefundResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,amount_pence,currency,payment_status,stripe_payment_intent_id,refunded_amount_pence").eq("id", bookingId).maybeSingle();
  if (!booking || !["paid", "refund_pending", "partially_refunded"].includes(booking.payment_status) || !booking.stripe_payment_intent_id) throw new Error("refund_not_eligible");
  const remaining = Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0);
  if (!Number.isSafeInteger(amountPence) || amountPence <= 0 || amountPence > remaining) throw new Error("refund_amount_invalid");
  const refundType = amountPence === Number(booking.amount_pence) ? "full" : "partial";
  const inserted = await admin.from("marketplace_refunds").insert({ booking_id: bookingId, stripe_payment_intent_id: booking.stripe_payment_intent_id, amount_pence: amountPence, currency: booking.currency || "gbp", refund_type: refundType, reason: reason.trim(), requested_by_admin_id: adminUserId }).select("id,stripe_refund_id,status").maybeSingle();
  if (inserted.error?.code === "23505") return { status: "already_processing" };
  if (inserted.error || !inserted.data) throw new Error("refund_reservation_failed");
  if (inserted.data.status === "succeeded") return { status: "succeeded", refundId: inserted.data.stripe_refund_id || undefined };
  try {
    const refund = await getStripe().refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: amountPence, reason: "requested_by_customer" }, { idempotencyKey: `marketplace-refund:${inserted.data.id}` });
    const persistedRefund = await admin.from("marketplace_refunds").update({ stripe_refund_id: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending", confirmed_at: refund.status === "succeeded" ? new Date().toISOString() : null }).eq("id", inserted.data.id).select("id").maybeSingle();
    if (persistedRefund.error || !persistedRefund.data) {
      console.error("[marketplace-refund] Stripe refund succeeded but its audit row could not be updated", { bookingId, refundId: refund.id });
      return { status: "already_processing", refundId: refund.id };
    }
    if (refund.status !== "succeeded") return { status: "already_processing", refundId: refund.id };
    const nextRefunded = Number(booking.refunded_amount_pence || 0) + amountPence;
    const persistedBooking = await admin.from("marketplace_bookings").update({ refunded_amount_pence: nextRefunded, payment_status: nextRefunded >= Number(booking.amount_pence) ? "refunded" : "partially_refunded", updated_at: new Date().toISOString() }).eq("id", bookingId).select("id").maybeSingle();
    if (persistedBooking.error || !persistedBooking.data) {
      console.error("[marketplace-refund] Refund recorded but booking payment state could not be updated", { bookingId, refundId: refund.id });
      return { status: "already_processing", refundId: refund.id };
    }
    return { status: "succeeded", refundId: refund.id };
  } catch (error) {
    await admin.from("marketplace_refunds").update({ status: "failed", failure_reason: describeStripeError(error).message }).eq("id", inserted.data.id).eq("status", "pending");
    console.error("[marketplace-refund] refund failed", { bookingId, reason: describeStripeError(error).message });
    return { status: "failed" };
  }
}
