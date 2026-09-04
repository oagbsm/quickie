import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canProviderOperate } from "@/lib/marketplace/provider-access";
import { normalizeJobSlug } from "@/app/data/marketplace";

type ConversationResult = { id: string };

export async function getOrCreateMarketplaceConversation({
  jobId,
  providerId,
  actorUserId,
  customerId,
}: {
  jobId: string;
  providerId: string;
  actorUserId: string;
  customerId?: string;
}): Promise<ConversationResult> {
  const admin = createSupabaseAdminClient();
  const { data: job, error: jobError } = await admin.from("marketplace_jobs").select("id,customer_id,service,service_subtype,postcode,status").eq("id", jobId).maybeSingle();
  if (jobError) throw queryFailure("marketplace_jobs lookup", jobError);
  if (!job) throw new Error("job not found");

  if (customerId) {
    if (job.customer_id !== customerId) throw new Error("customer does not own job");
    const quote = await admin.from("marketplace_quotes").select("id").eq("job_id", jobId).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).limit(1).maybeSingle();
    if (quote.error) throw queryFailure("marketplace_quotes lookup", quote.error);
    if (!quote.data) throw new Error("provider has no offer for job");
  } else {
    if (actorUserId !== providerId) throw new Error("provider identity mismatch");
    const profile = await admin.from("marketplace_providers").select("user_id,provider_status,stripe_status,marketplace_active").eq("user_id", providerId).maybeSingle();
    if (profile.error) throw queryFailure("marketplace_providers lookup", profile.error);
    if (!profile.data || !canProviderOperate(profile.data)) throw new Error("provider is not ready");
    const quote = await admin.from("marketplace_quotes").select("id").eq("job_id", jobId).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).limit(1).maybeSingle();
    if (!quote.error && !quote.data) {
      const services = await admin.from("marketplace_provider_services").select("category_slug,job_type_slug").eq("provider_id", providerId).eq("active", true);
      if (services.error) throw queryFailure("marketplace_provider_services lookup", services.error);
      const areas = await admin.from("marketplace_provider_service_areas").select("postcode_district").eq("provider_id", providerId).eq("active", true);
      if (areas.error) throw queryFailure("marketplace_provider_service_areas lookup", areas.error);
      const outward = String(job.postcode || "").trim().split(/\s+/)[0].toUpperCase();
      const eligible = (services.data || []).some((service) => service.category_slug === job.service && normalizeJobSlug(job.service, service.job_type_slug) === normalizeJobSlug(job.service, job.service_subtype || "")) && (areas.data || []).some((area) => area.postcode_district.toUpperCase() === outward);
      if (!eligible) throw new Error("provider is not eligible for job");
    }
  }

  const existing = await findConversation(admin, jobId, providerId);
  if (existing) return existing;
  const inserted = await admin.from("marketplace_conversations").insert({ job_id: jobId, customer_id: job.customer_id, provider_id: providerId, bidder_user_id: providerId }).select("id").single();
  if (!inserted.error && inserted.data) return inserted.data;
  if (inserted.error) console.error("Marketplace conversation insert failed", { operation: "insert marketplace_conversations", code: inserted.error.code, message: inserted.error.message, details: inserted.error.details, hint: inserted.error.hint });
  const afterConflict = await findConversation(admin, jobId, providerId);
  if (afterConflict) return afterConflict;
  throw new Error(`conversation insert failed: ${inserted.error?.message || "unknown error"}`);
}

export async function isMarketplaceConversationReadOnly(admin: ReturnType<typeof createSupabaseAdminClient>, conversationId: string) {
  const { data: conversation } = await admin.from("marketplace_conversations").select("id,job_id,provider_id,bidder_user_id").eq("id", conversationId).maybeSingle();
  if (!conversation) return false;
  const { data: accepted } = await admin.from("marketplace_quotes").select("provider_id,bidder_user_id").eq("job_id", conversation.job_id).in("status", ["accepted", "selected"]).limit(1).maybeSingle();
  if (!accepted) return false;
  const conversationProvider = conversation.provider_id || conversation.bidder_user_id;
  const winningProvider = accepted.provider_id || accepted.bidder_user_id;
  return Boolean(conversationProvider && winningProvider && conversationProvider !== winningProvider);
}

function queryFailure(operation: string, error: { code?: string; message?: string; details?: string; hint?: string }) {
  console.error("Marketplace conversation query failed", { operation, code: error.code, message: error.message, details: error.details, hint: error.hint });
  return new Error(`${operation} failed: ${error.message || "unknown error"}`);
}

async function findConversation(admin: ReturnType<typeof createSupabaseAdminClient>, jobId: string, providerId: string) {
  const result = await admin.from("marketplace_conversations").select("id").eq("job_id", jobId).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).limit(1).maybeSingle();
  if (!result.error) return result.data;
  console.error("Marketplace conversation lookup compatibility fallback", { operation: "marketplace_conversations lookup", code: result.error.code, message: result.error.message, details: result.error.details, hint: result.error.hint });
  const fallback = await admin.from("marketplace_conversations").select("id").eq("job_id", jobId).eq("provider_id", providerId).maybeSingle();
  if (fallback.error) console.error("Marketplace conversation provider lookup failed", { operation: "marketplace_conversations provider lookup", code: fallback.error.code, message: fallback.error.message, details: fallback.error.details, hint: fallback.error.hint });
  return fallback.data;
}
