"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function providerSignIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/pro/login?error=details");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/pro/login?error=credentials");
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();
  if (!user || !["quickola_provider", "quickola_cleaner"].includes(String(user.user_metadata?.account_kind || ""))) redirect("/pro/login?error=not-approved");
  const { data: provider } = await admin.from("cleaner_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!provider) await admin.from("cleaner_profiles").insert({ user_id: user.id, display_name: String(user.user_metadata?.full_name || "Provider"), role: "cleaner", provider_status: "draft", stripe_status: "not_started" });
  redirect("/work/onboarding");
}

export async function providerSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/pro/login");
}
