import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountRole = "admin" | "provider" | "customer";

/** One marketplace role resolver. Admin wins over stale provider/customer rows. */
export const getCurrentAccountRole = cache(async (): Promise<AccountRole | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [adminResult, providerResult, customerResult] = await Promise.all([
    supabase.from("admin_users").select("user_id").eq("user_id", user.id).eq("active", true).maybeSingle(),
    supabase.from("cleaner_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  if (adminResult.data) return "admin";
  if (providerResult.data) return "provider";
  if (customerResult.data) return "customer";
  return null;
});
