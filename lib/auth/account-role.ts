import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccountRole = "admin" | "provider" | "customer";
export type AccountStatus = "draft" | "pending_review" | "approved" | "action_required" | "suspended" | null;

export type CurrentAccountContext = {
  role: AccountRole | null;
  providerStatus: AccountStatus;
};

/** Resolve the signed-in marketplace account and its provider state once. */
export const getCurrentAccountContext = cache(async (): Promise<CurrentAccountContext> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null, providerStatus: null };
  const records = createSupabaseAdminClient();
  const [adminResult, providerResult, customerResult] = await Promise.all([
    records.from("admin_users").select("user_id").eq("user_id", user.id).eq("active", true).maybeSingle(),
    records.from("marketplace_providers").select("user_id,provider_status").eq("user_id", user.id).maybeSingle(),
    records.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  if (adminResult.data) return { role: "admin", providerStatus: null };
  if (providerResult.data) return { role: "provider", providerStatus: (providerResult.data.provider_status || "draft") as AccountStatus };
  if (customerResult.data) return { role: "customer", providerStatus: null };
  return { role: null, providerStatus: null };
});

/** One marketplace role resolver. Admin wins over stale provider/customer rows. */
export const getCurrentAccountRole = cache(async (): Promise<AccountRole | null> => (await getCurrentAccountContext()).role);

export function destinationForAccount(context: CurrentAccountContext): "/admin" | "/work" | "/work/onboarding" | "/my-jobs" | null {
  if (context.role === "admin") return "/admin";
  if (context.role === "customer") return "/my-jobs";
  if (context.role === "provider") return context.providerStatus === "draft" || context.providerStatus === "action_required" ? "/work/onboarding" : "/work";
  return null;
}
