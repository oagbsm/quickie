import "server-only";
import Stripe from "stripe";
import { getAppOrigin } from "@/lib/app-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type ProviderStripeState = "not_started" | "onboarding" | "restricted" | "ready";
type ProviderAccount = Stripe.V2.Core.Account;

function recipientCapabilityStatus(account: ProviderAccount) {
  return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
}

export function providerStripeState(account: ProviderAccount): ProviderStripeState {
  const requirements = account.requirements;
  const capabilityStatus = recipientCapabilityStatus(account);
  const hasPastDue = Boolean(requirements?.entries?.some((entry) => entry.minimum_deadline.status === "past_due"));
  const hasCurrentlyDue = Boolean(requirements?.entries?.some((entry) => entry.minimum_deadline.status === "currently_due"));

  if (capabilityStatus === "active" && !hasPastDue && !hasCurrentlyDue) return "ready";
  if (hasPastDue || capabilityStatus === "restricted" || capabilityStatus === "pending") return "restricted";
  return "onboarding";
}

async function retrieveProviderAccount(accountId: string) {
  return getStripe().v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements", "defaults"],
  });
}

async function ensureRecipientConfiguration(accountId: string, providerId: string) {
  const stripe = getStripe();
  const account = await retrieveProviderAccount(accountId);
  const transferCapability = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  const responsibilities = account.defaults?.responsibilities;
  if (!account.configuration?.recipient || !transferCapability || !responsibilities?.fees_collector || !responsibilities.losses_collector) {
    console.info("[provider-stripe] adding Accounts v2 recipient configuration", { providerId, accountId });
    return stripe.v2.core.accounts.update(
      accountId,
      {
        dashboard: "express",
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        metadata: { quickola_provider_id: providerId },
        include: ["configuration.recipient", "requirements", "defaults"],
      },
      { idempotencyKey: `provider-recipient-config:${providerId}` },
    );
  }
  return account;
}

export async function syncProviderStripeStatus(accountId: string, account?: ProviderAccount) {
  const stripeAccount = account || await retrieveProviderAccount(accountId);
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
    console.info("[provider-stripe] creating Accounts v2 connected account", { providerId });
    const account = await stripe.v2.core.accounts.create(
      {
        dashboard: "express",
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        metadata: { quickola_provider_id: providerId },
        include: ["configuration.recipient", "requirements"],
      },
      { idempotencyKey: `provider-account:${providerId}` },
    );
    console.info("[provider-stripe] Accounts v2 responsibilities configured", { providerId, accountId: account.id, feesCollector: "application", lossesCollector: "application" });
    accountId = account.id;
    const update = await admin.from("cleaner_profiles").update({ stripe_account_id: accountId, stripe_status: "onboarding", updated_at: new Date().toISOString() }).eq("user_id", providerId);
    if (update.error) throw new Error("provider_stripe_account_save_failed");
  } else {
    console.info("[provider-stripe] existing account reused", { providerId, accountId });
    await ensureRecipientConfiguration(accountId, providerId);
    await syncProviderStripeStatus(accountId);
  }
  const origin = getAppOrigin();
  try {
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url: `${origin}/work/onboarding?payouts=refresh`,
          return_url: `${origin}/work/onboarding?payouts=return`,
          collection_options: { fields: "eventually_due", future_requirements: "include" },
        },
      },
    });
    console.info("[provider-stripe] onboarding link created", { providerId, accountId });
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
  return syncProviderStripeStatus(profile.stripe_account_id);
}
