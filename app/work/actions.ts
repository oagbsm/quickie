"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireProviderOperationalAccess } from "@/lib/marketplace/provider-access";
import { getOrCreateMarketplaceConversation, isMarketplaceConversationReadOnly } from "@/lib/marketplace/conversations";
import { notifyCustomerCompletionRequest, notifyFirstMarketplaceMessage, notifyFirstMarketplaceOffer } from "@/lib/marketplace/email/transactional";

export async function submitWorkOffer(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const amount = Number(formData.get("amount") || 0);
  const message = String(formData.get("message") || "").trim();
  const availabilityMode = String(formData.get("availabilityMode") || "flexible").trim();
  const scheduledDate = String(formData.get("scheduledDate") || "").trim();
  if (!jobId || !Number.isFinite(amount) || amount <= 0 || amount > 100000 || !["today", "tomorrow", "choose_date", "flexible"].includes(availabilityMode)) redirect(`/work/jobs/${jobId}?error=validation`);
  const today = new Date();
  const dateForOffset = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const resolvedDate = availabilityMode === "today" ? dateForOffset(0) : availabilityMode === "tomorrow" ? dateForOffset(1) : availabilityMode === "choose_date" ? scheduledDate : "";
  if (availabilityMode === "choose_date" && (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedDate) || new Date(`${resolvedDate}T23:59:59`).getTime() < Date.now())) redirect(`/work/jobs/${jobId}?error=validation`);
  const provider = await requireProviderOperationalAccess();
  if (!provider) redirect(`/work/jobs/${jobId}?error=quote_setup`);
  const supabase = await createSupabaseServerClient();
  const availabilityText = availabilityMode === "today" ? "Today" : availabilityMode === "tomorrow" ? "Tomorrow" : availabilityMode === "flexible" ? "Flexible" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${resolvedDate}T12:00:00`));
  const { error } = await supabase.rpc("submit_marketplace_quote", { target_job: jobId, quote_amount: Math.round(amount * 100), quote_availability: resolvedDate ? "date" : "flexible", quote_available_at: resolvedDate ? `${resolvedDate}T09:00:00Z` : null, quote_availability_text: availabilityText, quote_message: message || null });
  if (error) redirect(`/work/jobs/${jobId}?error=${/booked|locked|not_open/i.test(error.message) ? "locked" : "offer"}`);
  if (resolvedDate) {
    const admin = createSupabaseAdminClient();
    await admin.from("marketplace_quotes").update({ scheduled_date: resolvedDate, arrival_window_start: null, arrival_window_end: null }).eq("job_id", jobId).eq("provider_id", provider.providerId);
  }
  try { await notifyFirstMarketplaceOffer(jobId); } catch (notificationError) { console.error("marketplace_offer_email_failed", { jobId, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }
  redirect(`/work/jobs/${jobId}?sent=1`);
}

export async function sendProviderJobMessage(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const body = String(formData.get("body") || "").trim();
  const clientMessageId = String(formData.get("clientMessageId") || "").trim();
  if (!jobId || !body || body.length > 4000) redirect(`/work/jobs/${jobId}?error=message`);
  const provider = await requireProviderOperationalAccess();
  if (!provider) redirect(`/work/jobs/${jobId}?error=quote_setup`);
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

  const admin = createSupabaseAdminClient();
  if (await isMarketplaceConversationReadOnly(admin, conversation.id)) redirect(`/work/jobs/${jobId}?error=conversation_closed`);
  const { error } = await supabase.rpc("create_marketplace_message", { target_conversation: conversation.id, message_body: body, target_client_message_id: clientMessageId || crypto.randomUUID() });
  if (error) {
    console.error("[sendProviderJobMessage] FAILED", { stage: "insert-message", providerId: provider.providerId, jobId, conversationId: conversation.id, code: error.code, message: error.message, details: error.details, hint: error.hint });
    redirect(`/work/jobs/${jobId}?error=message`);
  }

  try { await notifyFirstMarketplaceMessage(conversation.id, provider.user.id); } catch (notificationError) { console.error("marketplace_message_email_failed", { conversationId: conversation.id, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }

  revalidatePath(`/work/jobs/${jobId}`);
  redirect(`/work/jobs/${jobId}`);
}

export async function withdrawWorkOffer(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const provider = await requireProviderOperationalAccess();
  if (!provider) redirect(`/work/jobs/${jobId}?error=quote_setup`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("withdraw_marketplace_quote", { target_job: jobId });
  if (error) redirect(`/work/jobs/${jobId}?error=${/booked|locked/i.test(error.message) ? "locked" : "offer"}`);
  redirect(`/work/jobs/${jobId}`);
}

export async function advanceMarketplaceBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const nextStatus = String(formData.get("nextStatus") || "");
  const jobId = String(formData.get("jobId") || "");
  const provider = await requireProviderOperationalAccess();
  if (!provider) redirect(`/work/jobs/${jobId}?error=quote_setup`);
  if (!bookingId || !jobId || !["en_route", "arrived", "in_progress", "awaiting_customer_completion"].includes(nextStatus)) redirect(`/work/jobs/${jobId}?error=booking_transition`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_marketplace_booking_status", { target_booking: bookingId, next_status: nextStatus });
  if (error) redirect(`/work/jobs/${jobId}?error=booking_transition`);
  if (nextStatus === "awaiting_customer_completion") {
    try { await notifyCustomerCompletionRequest(bookingId); } catch (notificationError) { console.error("marketplace_completion_email_failed", { bookingId, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }
  }
  revalidatePath(`/work/jobs/${jobId}`);
  redirect(`/work/jobs/${jobId}`);
}

export async function cancelMarketplaceBookingAsProvider(formData: FormData) {
  const jobId = String(formData.get("jobId") || "");
  const bookingId = String(formData.get("bookingId") || "");
  const reasonCode = String(formData.get("reasonCode") || "provider_request").trim();
  const reasonText = String(formData.get("reasonText") || "").trim();
  const provider = await requireProviderOperationalAccess();
  if (!provider || !bookingId || !jobId || !reasonCode || !reasonText) redirect(`/work/jobs/${jobId}?error=cancel`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_marketplace_booking", { target_booking: bookingId, reason_code: reasonCode, reason_text: reasonText });
  if (error) redirect(`/work/jobs/${jobId}?error=cancel`);
  revalidatePath(`/work/jobs/${jobId}`); revalidatePath("/work/offers");
  redirect(`/work/jobs/${jobId}`);
}
