"use server";

import { redirect } from "next/navigation";
import { escapeHtml, sendAdminNotifications } from "@/lib/server/notifications";
import { marketplaceJobUrl, sendMarketplaceCustomerEmail } from "@/lib/server/marketplace-notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJob } from "@/app/data/marketplace";

const text = (form: FormData, key: string) => String(form.get(key) || "").trim();
const normaliseMobile = (value: string) => { const compact = value.replace(/[^\d+]/g, ""); return compact.startsWith("07") ? `+44${compact.slice(1)}` : compact; };
const isDraftToken = (value: string) => /^[0-9a-f-]{36}$/i.test(value);
function persistenceError(stage: string, error: unknown) {
  const value = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  console.error("marketplace_job_draft_failed", { stage, code: value?.code || null, message: value?.message || (error instanceof Error ? error.message : String(error)), details: value?.details || null, hint: value?.hint || null });
  return new Error(`draft_persistence_failed:${stage}`);
}

type DraftPayload = { category: string; service: string; answers: Record<string, string | number>; postcode: string; when: string; description: string; mobile: string; name: string };

async function persistDraft(payload: DraftPayload, photos: File[], submissionKey: string) {
  const admin = createSupabaseAdminClient();
  const { data: draft, error } = await admin.from("marketplace_job_drafts").insert({ payload, photo_paths: [], client_submission_key: submissionKey }).select("id,draft_token").single();
  if (error?.code === "23505") {
    const { data: existing } = await admin.from("marketplace_job_drafts").select("id,draft_token").eq("client_submission_key", submissionKey).single();
    if (existing) return existing as { id: string; draft_token: string };
  }
  if (error || !draft) throw persistenceError("draft_insert", error || new Error("missing_draft_row"));
  const paths: string[] = [];
  try {
    for (const photo of photos.slice(0, 6)) {
      const extension = photo.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const path = `drafts/${draft.id}/${crypto.randomUUID()}.${extension}`;
      const upload = await admin.storage.from("marketplace-job-photos").upload(path, await photo.arrayBuffer(), { contentType: photo.type || "image/jpeg", upsert: false });
      if (upload.error) throw upload.error;
      paths.push(path);
    }
    const update = await admin.from("marketplace_job_drafts").update({ photo_paths: paths, updated_at: new Date().toISOString() }).eq("id", draft.id);
    if (update.error) throw update.error;
    return draft as { id: string; draft_token: string };
  } catch (error) {
    const failure = persistenceError("draft_photo_or_update", error);
    if (paths.length) await admin.storage.from("marketplace-job-photos").remove(paths);
    await admin.from("marketplace_job_drafts").delete().eq("id", draft.id);
    throw failure;
  }
}

export async function publishPendingMarketplaceJob(draftToken: string) {
  if (!isDraftToken(draftToken)) return { error: "invalid_draft" as const };
  const supabase = await createSupabaseServerClient();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try { user = (await supabase.auth.getUser()).data.user; } catch (error) { persistenceError("auth_session_lookup", error); }
  if (!user) return { error: "authentication_required" as const };
  const admin = createSupabaseAdminClient();
  const { data: draft, error: draftError } = await admin.from("marketplace_job_drafts").select("id,draft_token,payload,photo_paths,published_job_id,expires_at").eq("draft_token", draftToken).maybeSingle();
  if (draftError || !draft || new Date(draft.expires_at).getTime() < Date.now()) return { error: "draft_expired" as const };
  if (draft.published_job_id) {
    const { data: existing } = await admin.from("marketplace_jobs").select("public_token").eq("id", draft.published_job_id).maybeSingle();
    if (existing) return { token: existing.public_token };
  }
  const payload = draft.payload as DraftPayload;
  let customer = (await admin.from("marketplace_customers").select("id,email").eq("auth_user_id", user.id).maybeSingle()).data;
  if (!customer) {
    const inserted = await admin.from("marketplace_customers").insert({ auth_user_id: user.id, email: user.email || null, display_name: payload.name || user.user_metadata?.full_name || null, mobile: payload.mobile ? normaliseMobile(payload.mobile) : null }).select("id,email").single();
    if (inserted.error || !inserted.data) return { error: "customer_persistence_failed" as const };
    customer = inserted.data;
  } else {
    await admin.from("marketplace_customers").update({ email: customer.email || user.email || null, display_name: payload.name || user.user_metadata?.full_name || null, mobile: payload.mobile ? normaliseMobile(payload.mobile) : undefined, updated_at: new Date().toISOString() }).eq("id", customer.id);
  }
  const insertedJob = await admin.from("marketplace_jobs").insert({ published_draft_id: draft.id, customer_id: customer.id, service: payload.category, service_subtype: payload.service, pricing_answers: payload.answers, postcode: payload.postcode, approximate_area: payload.postcode.split(/\s+/)[0].toUpperCase(), requested_at: payload.when && /^\d{4}-\d{2}-\d{2}$/.test(payload.when) ? `${payload.when}T09:00:00.000Z` : null, requested_timing: payload.when || null, optional_note: payload.description || null, estimated_price_pence: null, estimated_price_max_pence: null, booking_fee_pence: null, pricing_confidence: "not_configured", contact_method: user.email ? "email" : payload.mobile ? "phone" : null, contact_value: user.email || (payload.mobile ? normaliseMobile(payload.mobile) : null), contact_name: payload.name || user.user_metadata?.full_name || null }).select("id,public_token").single();
  let job = insertedJob.data;
  if (insertedJob.error?.code === "23505") job = (await admin.from("marketplace_jobs").select("id,public_token").eq("published_draft_id", draft.id).single()).data;
  if (insertedJob.error && insertedJob.error.code !== "23505") return { error: "job_persistence_failed" as const };
  if (!job) return { error: "job_persistence_failed" as const };
  const paths = Array.isArray(draft.photo_paths) ? draft.photo_paths.filter((path): path is string => typeof path === "string") : [];
  for (const path of paths) {
    const moved = await admin.storage.from("marketplace-job-photos").move(path, `${job.id}/${path.split("/").pop()}`);
    const finalPath = moved.error ? path : `${job.id}/${path.split("/").pop()}`;
    await admin.from("marketplace_job_photos").upsert({ job_id: job.id, storage_path: finalPath }, { onConflict: "storage_path" });
  }
  await admin.from("marketplace_job_drafts").update({ published_job_id: job.id, updated_at: new Date().toISOString() }).eq("id", draft.id);
  const result = await sendAdminNotifications({ telegramHtml: ["🧰 <b>New Quickola consumer job request</b>", `Category: <b>${escapeHtml(payload.category.replaceAll("-", " "))}</b>`, `Job: <b>${escapeHtml(payload.service.replaceAll("-", " "))}</b>`, `When: ${escapeHtml(payload.when || "Not specified")}`, `Postcode: ${escapeHtml(payload.postcode)}`, `Email: ${escapeHtml(user.email || "Not provided")}`, payload.mobile ? `Mobile: ${escapeHtml(payload.mobile)}` : "", payload.description ? `<b>Job details</b>\n${escapeHtml(payload.description)}` : "No extra job note provided"].join("\n") });
  if (!result.telegramSent) console.warn("marketplace_job_notification_failed");
  if (user.email) await sendMarketplaceCustomerEmail({ customerId: customer.id, jobId: job.id, eventType: "job_posted", recipient: user.email, idempotencyKey: `job_posted:${job.id}`, subject: "Your Quickola job is live", html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>Your job is live</h1><p>We’ll let you know when local professionals send quotes.</p><p><a href="${marketplaceJobUrl(job.public_token)}">View your job</a></p></div>` });
  return { token: job.public_token };
}

export async function submitConsumerJob(_state: { message: string }, form: FormData) {
  if (text(form, "website")) redirect("/post-job/thank-you");
  const category = text(form, "category"); const service = text(form, "service"); const description = text(form, "description"); const when = text(form, "when"); const postcode = text(form, "postcode"); const mobile = text(form, "contact"); const name = text(form, "name");
  const selectedJob = getJob(category, service);
  if (!selectedJob || !postcode) return { message: "Check the job type and postcode, then try again." };
  let answers: Record<string, string | number> = {};
  try { const parsed = JSON.parse(text(form, "answers") || "{}"); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) answers = parsed; } catch { /* optional answers remain empty */ }
  const payload: DraftPayload = { category, service, answers, postcode, when, description, mobile, name };
  let draft: { id: string; draft_token: string };
  try { draft = await persistDraft(payload, form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0), text(form, "submissionKey")); }
  catch (error) { return { message: error instanceof Error && error.message.startsWith("draft_persistence_failed") ? "We couldn’t save this job yet. Your details are still on this page; please try again." : "We couldn’t save this job yet. Please try again." }; }
  const published = await publishPendingMarketplaceJob(draft!.draft_token);
  if (published.token) redirect(`/jobs/${published.token}`);
  if (published.error === "authentication_required") redirect(`/sign-in?draft=${draft!.draft_token}`);
  if (published.error) return { message: "We couldn’t complete posting this job. Your details are still on this page; please try again." };
  return { message: "" };
}

export async function publishPendingMarketplaceJobAndRedirect(draftToken: string) {
  const result = await publishPendingMarketplaceJob(draftToken);
  if (result.token) redirect(`/jobs/${result.token}`);
  redirect(`/sign-in?draft=${encodeURIComponent(draftToken)}&error=${result.error || "publish_failed"}`);
}
