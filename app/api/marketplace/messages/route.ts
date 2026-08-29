import { NextResponse } from "next/server";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "marketplace-message-attachments";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function go(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const conversationId = String(form.get("conversationId") || "");
  const body = String(form.get("body") || "").trim();
  const requestedReturnTo = String(form.get("returnTo") || "");
  const fallback = `/messages/${conversationId}`;
  if (!conversationId) return go(request, "/messages?error=send");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return go(request, `/sign-in?next=${encodeURIComponent(fallback)}`);
  const provider = await getMarketplaceProvider();
  const admin = createSupabaseAdminClient();
  const { data: conversation } = await admin.from("marketplace_conversations").select("id,customer_id,provider_id,bidder_user_id").eq("id", conversationId).maybeSingle();
  const { data: customer } = conversation ? await admin.from("marketplace_customers").select("auth_user_id").eq("id", conversation.customer_id).maybeSingle() : { data: null };
  const providerIds = [user.id, provider?.providerId].filter(Boolean);
  const isProvider = Boolean(conversation && providerIds.some((id) => conversation.provider_id === id || conversation.bidder_user_id === id));
  const isCustomer = Boolean(conversation && customer?.auth_user_id === user.id);
  if (!conversation || (!isProvider && !isCustomer)) return go(request, fallback + "?error=access");
  const returnTo = requestedReturnTo.startsWith(isProvider ? "/work/messages/" : "/messages/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : `${isProvider ? "/work/messages" : "/messages"}/${conversationId}`;
  const files = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
  if (!body && files.length === 0 || body.length > 4000 || files.length > 5 || files.some((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE)) return go(request, `${returnTo}?error=attachment`);
  const { data: message, error: messageError } = await admin.from("marketplace_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body || null }).select("id").single();
  if (messageError || !message) return go(request, `${returnTo}?error=send`);
  const uploaded: string[] = [];
  for (const file of files) {
    const path = `${conversationId}/${user.id}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    const upload = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) {
      if (uploaded.length) await admin.storage.from(BUCKET).remove(uploaded);
      await admin.from("marketplace_messages").delete().eq("id", message.id);
      return go(request, `${returnTo}?error=attachment`);
    }
    uploaded.push(path);
  }
  if (uploaded.length) {
    const { error: attachmentError } = await admin.from("marketplace_message_attachments").insert(uploaded.map((storage_path) => ({ message_id: message.id, conversation_id: conversationId, uploader_id: user.id, storage_path, mime_type: files[uploaded.indexOf(storage_path)].type, file_size: files[uploaded.indexOf(storage_path)].size })));
    if (attachmentError) { await admin.storage.from(BUCKET).remove(uploaded); await admin.from("marketplace_messages").delete().eq("id", message.id); return go(request, `${returnTo}?error=attachment`); }
  }
  return go(request, returnTo);
}
