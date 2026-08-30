import { NextResponse } from "next/server";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyFirstMarketplaceMessage } from "@/lib/marketplace/email/transactional";

const BUCKET = "marketplace-message-attachments";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type FailureCode = "send" | "unauthorized" | "attachment_empty" | "attachment_invalid_type" | "attachment_too_large" | "attachment_upload_failed" | "message_db_failed" | "attachment_db_failed";

function go(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function safeError(error: unknown) {
  if (error && typeof error === "object") {
    const details = error as { name?: unknown; code?: unknown; message?: unknown };
    return {
      name: typeof details.name === "string" ? details.name : undefined,
      code: typeof details.code === "string" ? details.code : undefined,
      message: typeof details.message === "string" ? details.message.slice(0, 300) : "Unknown error",
    };
  }
  return { message: typeof error === "string" ? error.slice(0, 300) : "Unknown error" };
}

function logFailure(stage: string, details: Record<string, unknown>) {
  console.error("[chat-attachment]", stage, details);
}

function failure(request: Request, returnTo: string, code: FailureCode, details: Record<string, unknown> = {}) {
  console.error("[marketplace-message] rejected", { reason: code, returnTo, ...details });
  return go(request, `${returnTo}?error=${code}`);
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("[marketplace-message] rejected", { reason: "formdata_failed", error: safeError(error) });
    return go(request, "/messages?error=send");
  }

  const conversationId = String(form.get("conversationId") || "");
  const body = String(form.get("body") || "").trim();
  const requestedReturnTo = String(form.get("returnTo") || "");
  const rawFiles = form.getAll("attachments");
  console.info("[marketplace-message] incoming form", { conversationId, bodyLength: body.length, attachmentValues: rawFiles.length, attachmentMeta: rawFiles.map((item) => item instanceof File ? { kind: "file", name: item.name, type: item.type, size: item.size } : { kind: typeof item }) });
  const fallback = conversationId ? `/messages/${conversationId}` : "/messages";
  if (!conversationId) {
    console.error("[marketplace-message] rejected", { reason: "missing_conversation", attachmentCount: rawFiles.length });
    return go(request, "/messages?error=send");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[marketplace-message] rejected", { reason: "unauthenticated", conversationId, attachmentCount: rawFiles.length });
    return go(request, `/sign-in?next=${encodeURIComponent(fallback)}`);
  }

  const provider = await getMarketplaceProvider();
  const admin = createSupabaseAdminClient();
  const { data: conversation, error: conversationError } = await admin
    .from("marketplace_conversations")
    .select("id,customer_id,provider_id,bidder_user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) {
    logFailure("conversation_lookup_failed", { conversationId, userId: user.id, error: safeError(conversationError) });
    return failure(request, fallback, "send", { conversationId, userId: user.id, attachmentCount: rawFiles.length, error: safeError(conversationError) });
  }

  const { data: customer, error: customerError } = conversation
    ? await admin.from("marketplace_customers").select("auth_user_id").eq("id", conversation.customer_id).maybeSingle()
    : { data: null };
  if (customerError) logFailure("customer_lookup_failed", { conversationId, userId: user.id, error: safeError(customerError) });
  const providerIds = [user.id, provider?.providerId].filter(Boolean);
  const isProvider = Boolean(conversation && providerIds.some((id) => conversation.provider_id === id || conversation.bidder_user_id === id));
  const isCustomer = Boolean(conversation && customer?.auth_user_id === user.id);
  if (!conversation || (!isProvider && !isCustomer)) {
    logFailure("unauthorized", { conversationId, userId: user.id });
    return failure(request, fallback, "unauthorized", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  }

  const defaultReturnTo = `${isProvider ? "/work/messages" : "/messages"}/${conversationId}`;
  const prefix = isProvider ? "/work/messages/" : "/messages/";
  const returnTo = requestedReturnTo.startsWith(prefix) && !requestedReturnTo.startsWith("//") ? requestedReturnTo : defaultReturnTo;
  const files = rawFiles.filter((value): value is File => value instanceof File);

  if (rawFiles.some((value) => !(value instanceof File))) return failure(request, returnTo, "attachment_invalid_type", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  if (!body && files.length === 0) return failure(request, returnTo, "attachment_empty", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  if (body.length > 4000) return failure(request, returnTo, "send", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  if (files.length > MAX_FILES) return failure(request, returnTo, "attachment_too_large", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  if (files.some((file) => !ALLOWED_TYPES.has(file.type))) return failure(request, returnTo, "attachment_invalid_type", { conversationId, userId: user.id, attachmentCount: rawFiles.length });
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return failure(request, returnTo, "attachment_too_large", { conversationId, userId: user.id, attachmentCount: rawFiles.length });

  const uploaded: Array<{ path: string; file: File }> = [];
  for (const file of files) {
    const path = `${conversationId}/${user.id}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    try {
      const upload = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      uploaded.push({ path, file });
    } catch (error) {
      logFailure("upload_failed", { conversationId, userId: user.id, fileName: file.name, fileType: file.type, fileSize: file.size, storagePath: path, error: safeError(error) });
      if (uploaded.length) await admin.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
      return failure(request, returnTo, "attachment_upload_failed");
    }
  }

  const { data: message, error: messageError } = await admin
    .from("marketplace_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: body || null })
    .select("id")
    .single();
  if (messageError || !message) {
    logFailure("message_insert_failed", { conversationId, userId: user.id, error: safeError(messageError || new Error("Message insert returned no row")) });
    if (uploaded.length) await admin.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
    return failure(request, returnTo, "message_db_failed", { conversationId, userId: user.id, attachmentCount: rawFiles.length, error: safeError(messageError || new Error("Message insert returned no row")) });
  }

  if (uploaded.length) {
    const { error: attachmentError } = await admin.from("marketplace_message_attachments").insert(uploaded.map(({ path, file }) => ({
      message_id: message.id,
      conversation_id: conversationId,
      uploader_id: user.id,
      storage_path: path,
      mime_type: file.type,
      file_size: file.size,
    })));
    if (attachmentError) {
      logFailure("attachment_insert_failed", { conversationId, userId: user.id, messageId: message.id, storagePaths: uploaded.map((item) => item.path), error: safeError(attachmentError) });
      await admin.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
      await admin.from("marketplace_messages").delete().eq("id", message.id);
      return failure(request, returnTo, "attachment_db_failed");
    }
  }

  try { await notifyFirstMarketplaceMessage(conversationId, user.id); } catch (notificationError) { console.error("marketplace_message_email_failed", { conversationId, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }

  return go(request, returnTo);
}
