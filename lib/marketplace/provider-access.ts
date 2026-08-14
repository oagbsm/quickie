import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getApprovedMarketplaceProvider(): Promise<{
  user: User;
  providerId: string;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: provider } = await admin
    .from("cleaner_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("marketplace_active", true)
    .maybeSingle();
  return provider ? { user, providerId: provider.user_id } : null;
}

export async function getSignedInUser() {
  const supabase = await createSupabaseServerClient();
  return (await supabase.auth.getUser()).data.user;
}
