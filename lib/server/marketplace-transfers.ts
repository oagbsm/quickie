import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateMarketplaceProviderAmountPence, describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type MarketplaceTransferResult = { status: "paid" | "blocked" | "failed" | "already_processing"; transferId?: string };

/**
 * Transfer the persisted provider share after customer confirmation.
 * The database claim and Stripe idempotency key together make retries safe;
 * an ambiguous processing row is deliberately not automatically reclaimed.
 */
export async function transferMarketplaceProviderFunds(bookingId: string): Promise<MarketplaceTransferResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error: lookupError } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,provider_id,amount_pence,platform_fee_pence,currency,payment_status,status,completion_status,provider_transfer_status,provider_transfer_amount_pence,stripe_transfer_id").eq("id", bookingId).maybeSingle();
  if (lookupError) throw new Error("booking_transfer_lookup_failed");
  if (!booking) throw new Error("booking_not_found");
  if (booking.provider_transfer_status === "paid" || booking.stripe_transfer_id) return { status: "paid", transferId: booking.stripe_transfer_id || undefined };
  if (booking.provider_transfer_status === "processing" || booking.provider_transfer_status === "blocked") return { status: booking.provider_transfer_status === "processing" ? "already_processing" : "blocked" };

  if (booking.payment_status !== "paid" || booking.completion_status !== "completed" || booking.status !== "completed") {
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "blocked", provider_transfer_error: "completion_or_payment_not_ready", updated_at: new Date().toISOString() }).eq("id", booking.id).in("provider_transfer_status", ["pending", "failed"]);
    return { status: "blocked" };
  }
  const amountPence = Number(booking.amount_pence);
  const platformFeePence = Number(booking.platform_fee_pence);
  const providerAmountPence = calculateMarketplaceProviderAmountPence(amountPence, platformFeePence);
  if (providerAmountPence <= 0) return { status: "blocked" };

  const { data: claimed } = await admin.from("marketplace_bookings").update({ provider_transfer_status: "processing", provider_transfer_amount_pence: providerAmountPence, provider_transfer_error: null, updated_at: new Date().toISOString() }).eq("id", booking.id).in("provider_transfer_status", ["pending", "failed"]).select("id").maybeSingle();
  if (!claimed) {
    const { data: current } = await admin.from("marketplace_bookings").select("provider_transfer_status,stripe_transfer_id").eq("id", booking.id).maybeSingle();
    return current?.stripe_transfer_id || current?.provider_transfer_status === "paid" ? { status: "paid", transferId: current.stripe_transfer_id || undefined } : { status: "already_processing" };
  }

  const { data: provider } = await admin.from("marketplace_providers").select("user_id,stripe_account_id,stripe_status,marketplace_active").eq("user_id", booking.provider_id).maybeSingle();
  if (!provider?.stripe_account_id || provider.stripe_status !== "ready" || provider.marketplace_active === false) {
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "blocked", provider_transfer_error: "provider_stripe_not_ready", updated_at: new Date().toISOString() }).eq("id", booking.id);
    return { status: "blocked" };
  }

  try {
    const transfer = await getStripe().transfers.create({ amount: providerAmountPence, currency: booking.currency || "gbp", destination: provider.stripe_account_id, transfer_group: `marketplace_booking:${booking.id}`, metadata: { booking_id: booking.id, job_id: booking.job_id, quote_id: booking.quote_id } }, { idempotencyKey: `marketplace-provider-transfer:${booking.id}` });
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "paid", stripe_transfer_id: transfer.id, provider_transferred_at: new Date().toISOString(), provider_transfer_error: null, updated_at: new Date().toISOString() }).eq("id", booking.id);
    return { status: "paid", transferId: transfer.id };
  } catch (error) {
    console.error("[marketplace-transfer] provider transfer failed", { bookingId, ...describeStripeError(error) });
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "failed", provider_transfer_error: "stripe_transfer_failed", updated_at: new Date().toISOString() }).eq("id", booking.id);
    return { status: "failed" };
  }
}
