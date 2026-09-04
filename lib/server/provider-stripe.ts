import "server-only";
import Stripe from "stripe";
import { getAppOrigin } from "@/lib/app-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type ProviderStripeState = "not_started" | "onboarding" | "restricted" | "verification_pending" | "ready";
type ProviderAccount = Stripe.V2.Core.Account;
const QUICKOLA_PROVIDER_COUNTRY = "GB";

function recipientTransferCapability(account: ProviderAccount) {
  return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
}

export type ProviderStripeAssessment = {
  status: ProviderStripeState;
  payoutSetupCompleted: boolean;
  payoutsEnabled: boolean;
  onboardingStatus: string;
  actionableRequirementsCount: number;
  pendingVerificationCount: number;
};

type StripeAccountReadinessSnapshot = ProviderAccount & {
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: ProviderAccount["requirements"] & {
    currently_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  };
};

export function assessProviderStripeAccount(account: ProviderAccount): ProviderStripeAssessment {
  const snapshot = account as StripeAccountReadinessSnapshot;
  const requirements = snapshot.requirements;
  const transferCapability = recipientTransferCapability(snapshot);
  const entries = requirements?.entries || [];
  const actionableEntries = entries.filter((entry) =>
    entry.awaiting_action_from === "user" &&
    ["currently_due", "past_due"].includes(entry.minimum_deadline.status),
  );
  const explicitActionableRequirements = [
    ...(requirements?.currently_due || []),
    ...(requirements?.past_due || []),
  ];
  const actionableRequirements = [...new Set([
    ...actionableEntries.map((entry) => entry.description),
    ...explicitActionableRequirements,
  ])];
  const capabilityPendingVerification = transferCapability?.status_details?.filter((detail) => detail.code === "requirements_pending_verification") || [];
  const pendingVerificationRequirements = entries.filter((entry) => entry.awaiting_action_from === "stripe");
  const explicitPendingVerification = requirements?.pending_verification || [];
  const pendingVerificationCount = capabilityPendingVerification.length + pendingVerificationRequirements.length + explicitPendingVerification.length;
  const payoutsEnabled = transferCapability?.status === "active" || snapshot.payouts_enabled === true;
  const accountStarted = Boolean(snapshot.configuration?.recipient?.applied || snapshot.configuration?.recipient || snapshot.applied_configurations.includes("recipient") || snapshot.details_submitted);
  const payoutSetupCompleted = accountStarted && actionableRequirements.length === 0 && (payoutsEnabled || pendingVerificationCount > 0);
  const status: ProviderStripeState = payoutsEnabled
    ? "ready"
    : actionableRequirements.length > 0
      ? "restricted"
      : payoutSetupCompleted
        ? "verification_pending"
        : "onboarding";

  return {
    status,
    payoutSetupCompleted,
    payoutsEnabled,
    onboardingStatus: transferCapability?.status || (accountStarted ? "pending" : "not_started"),
    actionableRequirementsCount: actionableRequirements.length,
    pendingVerificationCount,
  };
}

export function providerStripeState(account: ProviderAccount): ProviderStripeState {
  return assessProviderStripeAccount(account).status;
}

async function retrieveProviderAccount(accountId: string) {
  return getStripe().v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements", "defaults", "identity"],
  });
}

async function resolveProviderEmail(providerId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(providerId);
  const email = data.user?.email?.trim().toLowerCase() || "";
  const verified = Boolean(data.user?.email_confirmed_at || data.user?.confirmed_at);
  if (error || !email || !verified || !email.includes("@")) {
    console.error("[provider-stripe] provider email missing", { providerId, hasEmail: Boolean(email), verified });
    throw new Error("provider_email_missing");
  }
  console.info("[provider-stripe] provider contact email resolved", { providerId, verified: true });
  return email;
}

async function ensureRecipientConfiguration(accountId: string, providerId: string, providerEmail: string) {
  const stripe = getStripe();
  const account = await retrieveProviderAccount(accountId);
  const transferCapability = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  const responsibilities = account.defaults?.responsibilities;
  const needsContactEmail = !account.contact_email;
  const needsCountry = account.identity?.country !== QUICKOLA_PROVIDER_COUNTRY;
  const needsRecipientConfiguration = !account.configuration?.recipient || !transferCapability || !responsibilities?.fees_collector || !responsibilities.losses_collector;
  if (needsContactEmail || needsCountry || needsRecipientConfiguration) {
    console.info("[provider-stripe] adding Accounts v2 recipient configuration", { providerId, accountId });
    const updated = await stripe.v2.core.accounts.update(
      accountId,
      {
        ...(needsContactEmail ? { contact_email: providerEmail } : {}),
        ...(needsCountry ? { identity: { country: QUICKOLA_PROVIDER_COUNTRY } } : {}),
        dashboard: "express",
        ...(needsRecipientConfiguration ? {
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
        } : {}),
        metadata: { quickola_provider_id: providerId },
        include: ["configuration.recipient", "requirements", "defaults", "identity"],
      },
      { idempotencyKey: `provider-recipient-config:${providerId}` },
    );
    if (needsContactEmail) console.info("[provider-stripe] existing account contact email updated", { providerId, accountId });
    if (needsCountry) console.info("[provider-stripe] existing account country updated", { providerId, accountId, country: QUICKOLA_PROVIDER_COUNTRY });
    return updated;
  }
  return account;
}

export async function syncProviderStripeStatus(accountId: string, account?: ProviderAccount) {
  const stripeAccount = account || await retrieveProviderAccount(accountId);
  const assessment = assessProviderStripeAccount(stripeAccount);
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.from("marketplace_providers").select("user_id,provider_status").eq("stripe_account_id", stripeAccount.id).maybeSingle();
  const result = await admin.from("marketplace_providers").update({ stripe_account_id: stripeAccount.id, stripe_status: assessment.status, marketplace_active: current?.provider_status === "approved" && assessment.payoutsEnabled, updated_at: new Date().toISOString() }).eq("stripe_account_id", stripeAccount.id);
  if (result.error) {
    console.error("[provider-stripe] status sync failed", { accountId, code: result.error.code, message: result.error.message });
    throw new Error("provider_stripe_status_sync_failed");
  }
  console.info("[provider-stripe] payout status refreshed", {
    providerId: current?.user_id || "unmatched",
    onboardingStatus: assessment.onboardingStatus,
    payoutSetupCompleted: assessment.payoutSetupCompleted,
    payoutsEnabled: assessment.payoutsEnabled,
    actionableRequirementsCount: assessment.actionableRequirementsCount,
    pendingVerificationCount: assessment.pendingVerificationCount,
  });
  return assessment;
}

export async function createProviderPayoutLink(providerId: string, returnPath = "/work/onboarding") {
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("marketplace_providers").select("user_id,stripe_account_id").eq("user_id", providerId).maybeSingle();
  if (error || !profile) throw new Error("provider_not_found");
  const stripe = getStripe();
  const providerEmail = await resolveProviderEmail(providerId);
  let accountId = profile.stripe_account_id;
  if (!accountId) {
    console.info("[provider-stripe] creating Accounts v2 connected account", { providerId });
    const account = await stripe.v2.core.accounts.create(
      {
        contact_email: providerEmail,
        identity: {
          country: QUICKOLA_PROVIDER_COUNTRY,
        },
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
    console.info("[provider-stripe] provider country configured", { providerId, accountId: account.id, country: QUICKOLA_PROVIDER_COUNTRY });
    console.info("[provider-stripe] Accounts v2 responsibilities configured", { providerId, accountId: account.id, feesCollector: "application", lossesCollector: "application" });
    accountId = account.id;
    const update = await admin.from("marketplace_providers").update({ stripe_account_id: accountId, stripe_status: "onboarding", updated_at: new Date().toISOString() }).eq("user_id", providerId);
    if (update.error) throw new Error("provider_stripe_account_save_failed");
  } else {
    console.info("[provider-stripe] existing account reused", { providerId, accountId });
    await ensureRecipientConfiguration(accountId, providerId, providerEmail);
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
          refresh_url: `${origin}${returnPath}?payouts=refresh`,
          return_url: `${origin}${returnPath}?payouts=return`,
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
  const { data: profile } = await admin.from("marketplace_providers").select("stripe_account_id").eq("user_id", providerId).maybeSingle();
  if (!profile?.stripe_account_id) return "not_started" as const;
  return syncProviderStripeStatus(profile.stripe_account_id);
}
