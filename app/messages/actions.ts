"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PHOTO_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function customerMessageContext(messageId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();
  if (!user || !messageId) return null;
  const { data: customer } = await admin.from("marketplace_customers").select("id,auth_user_id").eq("auth_user_id", user.id).maybeSingle();
  const { data: message } = await admin.from("marketplace_messages").select("id,conversation_id,sender_id,body").eq("id", messageId).maybeSingle();
  const { data: conversation } = message ? await admin.from("marketplace_conversations").select("id,job_id,customer_id").eq("id", message.conversation_id).maybeSingle() : { data: null };
  if (!customer || !message || !conversation || conversation.customer_id !== customer.id || message.sender_id !== user.id) return null;
  const [{ data: job }, { data: booking }, { data: selectedQuote }] = await Promise.all([
    admin.from("marketplace_jobs").select("id,public_token,optional_note,status").eq("id", conversation.job_id).eq("customer_id", customer.id).maybeSingle(),
    admin.from("marketplace_bookings").select("id,status,payment_status").eq("job_id", conversation.job_id).maybeSingle(),
    admin.from("marketplace_quotes").select("id").eq("job_id", conversation.job_id).in("status", ["accepted", "selected"]).maybeSingle(),
  ]);
  if (!job) return null;
  if (booking || selectedQuote || !["posted", "finding_provider", "provider_available"].includes(job.status)) {
    throw new Error("This job can no longer be changed after a provider has been selected.");
  }
  return { admin, message, conversation, job };
}

function revalidateJob(jobId: string, token: string) {
  revalidatePath(`/jobs/${token}`);
  revalidatePath(`/work/jobs/${jobId}`);
  revalidatePath("/work");
}

export async function promoteMarketplacePhoto(formData: FormData) {
  const messageId = String(formData.get("messageId") || "");
  const attachmentId = String(formData.get("attachmentId") || "");
  const context = await customerMessageContext(messageId);
  if (!context || !attachmentId) return;
  const { admin, message, conversation, job } = context;
  const { data: attachment } = await admin.from("marketplace_message_attachments").select("id,message_id,conversation_id,storage_path,mime_type").eq("id", attachmentId).eq("message_id", message.id).eq("conversation_id", conversation.id).maybeSingle();
  if (!attachment || !PHOTO_EXTENSIONS[attachment.mime_type]) return;
  const { data: existing } = await admin.from("marketplace_job_photos").select("id").eq("source_message_attachment_id", attachment.id).maybeSingle();
  if (existing) return;

  const download = await admin.storage.from("marketplace-message-attachments").download(attachment.storage_path);
  if (download.error || !download.data) return;
  const targetPath = `${job.id}/conversation-${attachment.id}.${PHOTO_EXTENSIONS[attachment.mime_type]}`;
  const upload = await admin.storage.from("marketplace-job-photos").upload(targetPath, download.data, { contentType: attachment.mime_type, upsert: false });
  if (upload.error) return;
  const inserted = await admin.from("marketplace_job_photos").insert({ job_id: job.id, storage_path: targetPath, source_message_attachment_id: attachment.id });
  if (inserted.error) {
    if (inserted.error.code !== "23505") await admin.storage.from("marketplace-job-photos").remove([targetPath]);
    return;
  }
  revalidateJob(job.id, job.public_token);
}

export async function promoteMarketplaceDetail(formData: FormData) {
  const messageId = String(formData.get("messageId") || "");
  const context = await customerMessageContext(messageId);
  if (!context || !context.message.body?.trim()) return;
  const { admin, message, job } = context;
  const promotion = await admin.from("marketplace_job_detail_promotions").insert({ job_id: job.id, source_message_id: message.id, customer_id: context.conversation.customer_id, detail: message.body.trim() }).select("id").single();
  if (promotion.error) {
    if (promotion.error.code === "23505") return;
    return;
  }
  const note = job.optional_note?.trim();
  const combined = note ? `${note}\n\n${message.body.trim()}` : message.body.trim();
  const update = await admin.from("marketplace_jobs").update({ optional_note: combined.slice(0, 4000), updated_at: new Date().toISOString() }).eq("id", job.id).eq("customer_id", context.conversation.customer_id);
  if (update.error) {
    await admin.from("marketplace_job_detail_promotions").delete().eq("id", promotion.data?.id || "");
    return;
  }
  revalidateJob(job.id, job.public_token);
}
