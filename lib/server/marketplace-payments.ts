import "server-only";
import Stripe from "stripe";

// Connect is not configured yet, so test payments are collected by Quickola
// without pretending that a provider payout has taken place.
export const MARKETPLACE_PLATFORM_FEE_PERCENT = 0;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("stripe_not_configured");
  if (!secret.startsWith("sk_test_")) throw new Error("stripe_test_key_required");
  return new Stripe(secret);
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("stripe_webhook_not_configured");
  return secret;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
