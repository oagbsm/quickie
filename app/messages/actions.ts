"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyFirstMarketplaceMessage } from "@/lib/marketplace/email/transactional";

export async function sendMarketplaceMessage(formData: FormData) {
  const conversationId = String(formData.get("conversationId") || "");
  const body = String(formData.get("body") || "").trim();
  const jobToken = String(formData.get("jobToken") || "");
  const returnTo = String(formData.get("returnTo") || "");
  if (!conversationId || !body || body.length > 4000) redirect(`/messages/${conversationId}`);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${conversationId}`)}`);
  const { error } = await supabase.rpc("create_marketplace_message", { target_conversation: conversationId, message_body: body });
  if (error) redirect(`/messages/${conversationId}?error=send`);
  try { await notifyFirstMarketplaceMessage(conversationId, user.id); } catch (notificationError) { console.error("marketplace_message_email_failed", { conversationId, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }
  redirect(returnTo.startsWith("/") ? returnTo : jobToken ? `/jobs/${jobToken}` : `/messages/${conversationId}`);
}
