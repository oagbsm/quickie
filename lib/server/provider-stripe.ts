import "server-only";
import Stripe from "stripe";
import { getAppOrigin } from "@/lib/app-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type ProviderStripeState = "not_started" | "onboarding" | "restricted" | "ready";

export function providerStripeState(account: Pick<Stripe.Account, "details_submitted" | "charges_enabled" | "payouts_enabled" | "requirements">): ProviderStripeState {
  if (account.charges_enabled && account.payouts_enabled && !(account.requirements?.currently_due || []).length) return "ready";
  if ((account.requirements?.currently_due || []).length || (account.requirements?.past_due || []).length) return "restricted";
  return account.details_submitted ? "onboarding" : "onboarding";
}

export async function syncProviderStripeStatus(accountId: string, account?: Stripe.Account) {
  const stripeAccount = account || await getStripe().accounts.retrieve(accountId);
  const status = providerStripeState(stripeAccount);
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.from("cleaner_profiles").select("provider_status").eq("stripe_account_id", stripeAccount.id).maybeSingle();
  const result = await admin.from("cleaner_profiles").update({ stripe_account_id: stripeAccount.id, stripe_status: status, marketplace_active: current?.provider_status === "approved" && status === "ready", updated_at: new Date().toISOString() }).eq("stripe_account_id", stripeAccount.id);
  if (result.error) {
    console.error("[provider-stripe] status sync failed", { accountId, code: result.error.code, message: result.error.message });
    throw new Error("provider_stripe_status_sync_failed");
  }
  return status;
}

export async function createProviderPayoutLink(providerId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("cleaner_profiles").select("user_id,stripe_account_id").eq("user_id", providerId).maybeSingle();
  if (error || !profile) throw new Error("provider_not_found");
  const stripe = getStripe();
  let accountId = profile.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express", capabilities: { transfers: { requested: true } }, metadata: { quickola_provider_id: providerId } });
    accountId = account.id;
    const update = await admin.from("cleaner_profiles").update({ stripe_account_id: accountId, stripe_status: "onboarding", updated_at: new Date().toISOString() }).eq("user_id", providerId);
    if (update.error) throw new Error("provider_stripe_account_save_failed");
  } else {
    await syncProviderStripeStatus(accountId);
  }
  const origin = getAppOrigin();
  try {
    const link = await stripe.accountLinks.create({ account: accountId, type: "account_onboarding", refresh_url: `${origin}/work/onboarding?payouts=refresh`, return_url: `${origin}/work/onboarding?payouts=return`, collection_options: { fields: "eventually_due" } });
    return link.url;
  } catch (error) {
    console.error("[provider-stripe] account link failed", { providerId, accountId, ...describeStripeError(error) });
    throw new Error("provider_stripe_link_failed");
  }
}

export async function refreshProviderPayoutStatus(providerId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("cleaner_profiles").select("stripe_account_id").eq("user_id", providerId).maybeSingle();
  if (!profile?.stripe_account_id) return "not_started" as const;
  const account = await getStripe().accounts.retrieve(profile.stripe_account_id);
  return syncProviderStripeStatus(profile.stripe_account_id, account);
}
