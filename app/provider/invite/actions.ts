"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashProviderInviteToken } from "@/lib/server/provider-invitations";

export async function createInvitedProviderAccount(input: {
  token: string;
  email: string;
  password: string;
}) {
  const token = input.token.trim();
  const email = input.email.trim().toLowerCase();
  if (!token || !/^\S+@\S+\.\S+$/.test(email) || input.password.length < 6)
    return { ok: false as const, error: "invalid" };

  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("marketplace_provider_invitations")
    .select("email,invited_name,phone,category_slug,service_area,status,expires_at")
    .eq("token_hash", hashProviderInviteToken(token))
    .maybeSingle();
  if (
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at).getTime() <= Date.now() ||
    invitation.email.trim().toLowerCase() !== email
  )
    return { ok: false as const, error: "invalid" };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      account_kind: "quickola_provider",
      full_name: invitation.invited_name,
      phone: invitation.phone,
    },
  });
  if (error) {
    if (error.code === "email_exists" || /already been registered|already exists/i.test(error.message))
      return { ok: false as const, error: "already_exists" };
    return { ok: false as const, error: "create_failed" };
  }
  return { ok: Boolean(data.user), error: data.user ? undefined : "create_failed" };
}
