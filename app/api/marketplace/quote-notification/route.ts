import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyFirstMarketplaceOffer } from "@/lib/marketplace/email/transactional";
import { ACTIVE_MARKETPLACE_OFFER_STATUSES } from "@/lib/marketplace/customer-job-state";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization"); const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(); if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { jobId?: string; quoteId?: string };
  if (!body.jobId || !body.quoteId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,provider_id,bidder_user_id,status").eq("id", body.quoteId).eq("job_id", body.jobId).maybeSingle();
  if (!quote || ![quote.provider_id, quote.bidder_user_id].includes(user.id) || !ACTIVE_MARKETPLACE_OFFER_STATUSES.includes(quote.status)) return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  const { data: job } = await admin.from("marketplace_jobs").select("id,public_token,customer_id").eq("id", body.jobId).maybeSingle();
  if (!job?.customer_id) return NextResponse.json({ ok: true });
  try { await notifyFirstMarketplaceOffer(job.id, quote.id); } catch (error) { console.error("marketplace_offer_email_failed", { jobId: job.id, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" }); }
  return NextResponse.json({ ok: true });
}
