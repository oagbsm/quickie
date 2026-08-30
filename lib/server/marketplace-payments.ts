import "server-only";
import Stripe from "stripe";
import { getAppOrigin } from "@/lib/app-url";

// Sandbox marketplace payments are collected by Quickola first. Provider funds
// are transferred only after customer completion confirmation.
export const MARKETPLACE_PLATFORM_FEE_PERCENT = 10;

/** Calculate the commission once, in integer pence, using deterministic rounding. */
export function calculateMarketplacePlatformFeePence(amountPence: number) {
  if (!Number.isSafeInteger(amountPence) || amountPence < 0) throw new Error("invalid_amount_pence");
  return Math.floor(amountPence * MARKETPLACE_PLATFORM_FEE_PERCENT / 100);
}

export function calculateMarketplaceProviderAmountPence(amountPence: number, platformFeePence: number) {
  if (!Number.isSafeInteger(amountPence) || !Number.isSafeInteger(platformFeePence) || amountPence < 0 || platformFeePence < 0 || platformFeePence > amountPence) {
    throw new Error("invalid_marketplace_amounts");
  }
  return amountPence - platformFeePence;
}

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
