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
  const { data: provider } = user
    ? await admin.from("cleaner_profiles").select("user_id").eq("user_id", user.id).eq("marketplace_active", true).maybeSingle()
    : { data: null };
  if (!provider) redirect("/pro/login?error=not-approved");
  redirect("/work");
}

export async function providerSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/pro/login");
}
