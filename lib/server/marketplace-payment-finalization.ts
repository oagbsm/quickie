import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { notifyBookingPaid } from "@/lib/marketplace/email/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PaymentAdmin = ReturnType<typeof createSupabaseAdminClient>;

type PaymentBooking = {
  id: string;
  job_id: string;
  quote_id: string;
  conversation_id?: string | null;
  amount_pence: number;
  currency: string;
  payment_status?: string | null;
  marketplace_jobs?: { public_token?: string | null } | { public_token?: string | null }[] | null;
};

export async function finalizeMarketplacePayment(admin: PaymentAdmin, booking: PaymentBooking, session: Stripe.Checkout.Session) {
  const { error: updateError } = await admin.from("marketplace_bookings").update({
    payment_status: "paid",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
    paid_at: new Date().toISOString(),
    status: "booked",
  }).eq("id", booking.id).neq("payment_status", "paid");
  if (updateError) throw new Error("booking_update_failed");

  const { error: jobError } = await admin.from("marketplace_jobs").update({ status: "booked", updated_at: new Date().toISOString() }).eq("id", booking.job_id).in("status", ["awaiting_booking", "finding_provider", "posted"]);
  if (jobError) throw new Error("job_update_failed");

  try { await notifyBookingPaid(booking.id); } catch (error) { console.error("marketplace_booking_email_failed", { bookingId: booking.id, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" }); }
  const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  revalidatePath("/my-jobs");
  if (job?.public_token) revalidatePath(`/jobs/${job.public_token}`);
  if (booking.conversation_id) revalidatePath(`/messages/${booking.conversation_id}`);
}

export async function reconcileMarketplacePaymentOnReturn(admin: PaymentAdmin, bookingId: string) {
  const { getStripe } = await import("@/lib/server/marketplace-payments");
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,conversation_id,amount_pence,currency,payment_status,stripe_checkout_session_id,marketplace_jobs(public_token)").eq("id", bookingId).maybeSingle();
  if (error || !booking || booking.payment_status === "paid" || !booking.stripe_checkout_session_id) return false;
  const session = await getStripe().checkout.sessions.retrieve(booking.stripe_checkout_session_id);
  if (session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.booking_id !== booking.id || session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id || session.amount_total !== Number(booking.amount_pence) || (session.currency && session.currency !== booking.currency)) return false;
  const { data: quote } = await admin.from("marketplace_quotes").select("id,status,job_id").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) return false;
  await finalizeMarketplacePayment(admin, booking, session);
  return true;
}
