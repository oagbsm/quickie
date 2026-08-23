"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";
import { getOrCreateMarketplaceConversation } from "@/lib/marketplace/conversations";

export async function submitWorkOffer(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const amount = Number(formData.get("amount") || 0);
  const message = String(formData.get("message") || "").trim();
  const scheduledDate = String(formData.get("scheduledDate") || "").trim();
  const arrivalWindowStart = String(formData.get("arrivalWindowStart") || "").trim();
  const arrivalWindowEnd = String(formData.get("arrivalWindowEnd") || "").trim();
  if (!jobId || !Number.isFinite(amount) || amount <= 0) redirect(`/work/jobs/${jobId}?error=validation`);
  const provider = await requireProviderWorkspaceAccess();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_marketplace_quote", { target_job: jobId, quote_amount: Math.round(amount * 100), quote_availability: "date", quote_available_at: scheduledDate && arrivalWindowStart ? `${scheduledDate}T${arrivalWindowStart}:00Z` : null, quote_availability_text: scheduledDate ? `${scheduledDate} · ${arrivalWindowStart}–${arrivalWindowEnd}` : "Schedule to be confirmed", quote_message: message || null });
  if (error) redirect(`/work/jobs/${jobId}?error=${/booked|locked|not_open/i.test(error.message) ? "locked" : "offer"}`);
  if (scheduledDate && arrivalWindowStart && arrivalWindowEnd) {
    const admin = createSupabaseAdminClient();
    await admin.from("marketplace_quotes").update({ scheduled_date: scheduledDate, arrival_window_start: arrivalWindowStart, arrival_window_end: arrivalWindowEnd }).eq("job_id", jobId).eq("provider_id", provider.providerId);
  }
  redirect(`/work/jobs/${jobId}?sent=1`);
}

export async function sendProviderJobMessage(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!jobId || !body || body.length > 4000) redirect(`/work/jobs/${jobId}?error=message`);
  const provider = await requireProviderWorkspaceAccess();
  const supabase = await createSupabaseServerClient();

  let conversation;
  try {
    conversation = await getOrCreateMarketplaceConversation({ jobId, providerId: provider.providerId, actorUserId: provider.user.id });
  } catch (error) {
    console.error("[sendProviderJobMessage] FAILED", {
      stage: "resolve-or-create-conversation",
      providerId: provider.providerId,
      jobId,
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
      message: error instanceof Error ? error.message : "unknown error",
      details: error && typeof error === "object" && "details" in error ? error.details : undefined,
      hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined,
    });
    redirect(`/work/jobs/${jobId}?error=message`);
  }

  const { error } = await supabase.rpc("create_marketplace_message", { target_conversation: conversation.id, message_body: body });
  if (error) {
    console.error("[sendProviderJobMessage] FAILED", { stage: "insert-message", providerId: provider.providerId, jobId, conversationId: conversation.id, code: error.code, message: error.message, details: error.details, hint: error.hint });
    redirect(`/work/jobs/${jobId}?error=message`);
  }

  revalidatePath(`/work/jobs/${jobId}`);
  redirect(`/work/jobs/${jobId}`);
}

export async function withdrawWorkOffer(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  await requireProviderWorkspaceAccess();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("withdraw_marketplace_quote", { target_job: jobId });
  if (error) redirect(`/work/jobs/${jobId}?error=${/booked|locked/i.test(error.message) ? "locked" : "offer"}`);
  redirect(`/work/jobs/${jobId}`);
}

export async function advanceMarketplaceBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const nextStatus = String(formData.get("nextStatus") || "");
  const jobId = String(formData.get("jobId") || "");
  await requireProviderWorkspaceAccess();
  if (!bookingId || !jobId || !["en_route", "arrived", "in_progress", "awaiting_customer_completion"].includes(nextStatus)) redirect(`/work/jobs/${jobId}?error=booking_transition`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_marketplace_booking_status", { target_booking: bookingId, next_status: nextStatus });
  if (error) redirect(`/work/jobs/${jobId}?error=booking_transition`);
  revalidatePath(`/work/jobs/${jobId}`);
  redirect(`/work/jobs/${jobId}`);
}
