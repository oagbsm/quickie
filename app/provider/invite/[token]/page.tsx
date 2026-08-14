import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import InviteClient from "../InviteClient";

export default async function ProviderInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { createHash } = await import("node:crypto");
  const { data: invite } = await admin.from("marketplace_provider_invitations").select("email,status,expires_at").eq("token_hash", createHash("sha256").update(token).digest("hex")).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!invite || invite.status === "revoked" || invite.status === "accepted") notFound();
  return <InviteClient token={token} email={invite.email} />;
}
