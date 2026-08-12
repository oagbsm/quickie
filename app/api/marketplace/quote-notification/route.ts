import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMarketplaceCustomerEmail } from "@/lib/server/marketplace-notifications";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization"); const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(); if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { jobId?: string; quoteId?: string };
  if (!body.jobId || !body.quoteId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,provider_id").eq("id", body.quoteId).eq("job_id", body.jobId).maybeSingle();
  if (!quote || quote.provider_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  const { data: job } = await admin.from("marketplace_jobs").select("id,public_token,customer_id").eq("id", body.jobId).maybeSingle();
  if (!job?.customer_id) return NextResponse.json({ ok: true });
  const { data: customer } = await admin.from("marketplace_customers").select("id,email").eq("id", job.customer_id).maybeSingle();
  if (customer?.email) await sendMarketplaceCustomerEmail({ customerId: customer.id, jobId: job.id, eventType: "new_quote", recipient: customer.email, idempotencyKey: `new_quote:${quote.id}`, subject: "You have a new Quickola quote", html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>New quote received</h1><p>A local professional has sent a quote for your job.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://quickola.co.uk"}/sign-in?next=${encodeURIComponent(`/jobs/${job.public_token}`)}">View your quote</a></p></div>` });
  return NextResponse.json({ ok: true });
}
