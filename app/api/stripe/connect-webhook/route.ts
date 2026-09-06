import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { describeStripeError, getStripe, getStripeConnectWebhookSecret } from "@/lib/server/marketplace-payments";
import { syncProviderStripeStatus } from "@/lib/server/provider-stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processDirectChargeWebhookEvent } from "@/lib/server/marketplace-direct-charge-webhooks";

const HANDLED_EVENTS = new Set([
  "v2.core.account[configuration.recipient].updated",
  "v2.core.account[configuration.recipient].capability_status_updated",
  "v2.core.account[requirements].updated",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    console.error("[provider-stripe] connect webhook rejected", { stage: "signature", reason: "missing_signature" });
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let notification: ReturnType<ReturnType<typeof getStripe>["parseEventNotification"]> | null = null;
  let event: Stripe.Event | null = null;
  try {
    const secret = getStripeConnectWebhookSecret();
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret);
    } catch {
      notification = getStripe().parseEventNotification(body, signature, secret);
    }
  } catch (error) {
    const configurationError = error instanceof Error && error.message === "stripe_connect_webhook_not_configured";
    console.error("[provider-stripe] connect webhook rejected", {
      stage: configurationError ? "configuration" : "verification",
      ...describeStripeError(error),
    });
    return NextResponse.json(
      { error: configurationError ? "connect_webhook_not_configured" : "invalid_signature" },
      { status: configurationError ? 500 : 400 },
    );
  }

  if (event) {
    try {
      if (["checkout.session.completed", "payment_intent.succeeded", "charge.refunded", "charge.dispute.created", "application_fee.created"].includes(event.type)) {
        await processDirectChargeWebhookEvent(createSupabaseAdminClient(), event);
      }
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("[provider-stripe] connect webhook processing failed", {
        stage: "processing",
        eventId: event.id,
        eventType: event.type,
        ...describeStripeError(error),
      });
      return NextResponse.json({ error: "connect_webhook_processing_failed" }, { status: 500 });
    }
  }

  if (!notification) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  const accountId = "related_object" in notification ? notification.related_object?.id : undefined;
  console.info("[provider-stripe] connect webhook verified", {
    stage: "verified",
    eventId: notification.id,
    eventType: notification.type,
    stripeAccountId: accountId,
  });

  if (!HANDLED_EVENTS.has(notification.type) || !accountId) {
    return NextResponse.json({ received: true });
  }

  try {
    await syncProviderStripeStatus(accountId);
    revalidatePath("/work");
    revalidatePath("/work/onboarding");
    revalidatePath("/admin/providers");
    console.info("[provider-stripe] connect account status synced", {
      stage: "processed",
      eventId: notification.id,
      eventType: notification.type,
      stripeAccountId: accountId,
    });
  } catch (error) {
    console.error("[provider-stripe] connect webhook processing failed", {
      stage: "processing",
      eventId: notification.id,
      eventType: notification.type,
      stripeAccountId: accountId,
      ...describeStripeError(error),
    });
    return NextResponse.json({ error: "provider_status_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
