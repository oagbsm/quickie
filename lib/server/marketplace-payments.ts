import "server-only";
import Stripe from "stripe";
import { getAppOrigin } from "@/lib/app-url";

// Connect is not configured yet, so test payments are collected by Quickola
// without pretending that a provider payout has taken place.
export const MARKETPLACE_PLATFORM_FEE_PERCENT = 0;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("stripe_not_configured");
  if (!secret.startsWith("sk_test_")) throw new Error("stripe_test_key_required");
  return new Stripe(secret);
}

export function describeStripeError(error: unknown) {
  if (!(error instanceof Error)) return { name: "UnknownError", message: "unknown" };
  const details = error as Error & { type?: string; code?: string; statusCode?: number; requestId?: string };
  return { name: details.name, message: details.message, type: details.type, code: details.code, statusCode: details.statusCode, requestId: details.requestId };
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("stripe_webhook_not_configured");
  return secret;
}

export function getStripeConnectWebhookSecret() {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) throw new Error("stripe_connect_webhook_not_configured");
  return secret;
}

export function getSiteUrl() {
  try {
    return getAppOrigin();
  } catch {
    throw new Error("stripe_site_url_invalid");
  }
}
