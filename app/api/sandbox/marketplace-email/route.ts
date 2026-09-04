import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyCustomerCompletionRequest, notifyCompletionOutcome, notifyFirstMarketplaceOffer, type EmailDispatchResult } from "@/lib/marketplace/email/transactional";

type EventName = "offer" | "provider_completion" | "customer_completion";
const SANDBOX_FIXTURE_EMAIL_SET = new Set(["customer+sandbox@quickola.test", "provider+sandbox@quickola.test", "admin+sandbox@quickola.test"]);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.QUICKOLA_SANDBOX !== "true" || process.env.QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX !== "true" || process.env.QUICKOLA_SCENARIO_EXECUTION_CONFIRM !== "RUN_SANDBOX_SCENARIOS_ONLY") return NextResponse.json({ error: "sandbox_only" }, { status: 404 });
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!SANDBOX_FIXTURE_EMAIL_SET.has(user.email?.toLowerCase() || "")) return NextResponse.json({ error: "sandbox_fixture_required" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { event?: EventName; jobId?: string; quoteId?: string; bookingId?: string };
  const event = body.event;
  if (!event || !["offer", "provider_completion", "customer_completion"].includes(event)) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  let result: EmailDispatchResult;
  if (event === "offer") {
    if (!body.jobId || !body.quoteId) return NextResponse.json({ error: "invalid_offer" }, { status: 400 });
    const { data: quote } = await admin.from("marketplace_quotes").select("provider_id,bidder_user_id,job_id").eq("id", body.quoteId).eq("job_id", body.jobId).maybeSingle();
    if (!quote || ![quote.provider_id, quote.bidder_user_id].includes(user.id)) return NextResponse.json({ error: "not_allowed" }, { status: 403 });
    result = await notifyFirstMarketplaceOffer(body.jobId, body.quoteId);
  } else {
    if (!body.bookingId) return NextResponse.json({ error: "invalid_booking" }, { status: 400 });
    const { data: booking } = await admin.from("marketplace_bookings").select("provider_id,customer_id,marketplace_customers(auth_user_id)").eq("id", body.bookingId).maybeSingle();
    const customer = Array.isArray(booking?.marketplace_customers) ? booking.marketplace_customers[0] : booking?.marketplace_customers;
    const isProvider = event === "provider_completion" && booking?.provider_id === user.id;
    const isCustomer = event === "customer_completion" && customer?.auth_user_id === user.id;
    if (!booking || (!isProvider && !isCustomer)) return NextResponse.json({ error: "not_allowed" }, { status: 403 });
    result = event === "provider_completion" ? await notifyCustomerCompletionRequest(body.bookingId) : await notifyCompletionOutcome(body.bookingId, "confirmed", "blocked");
  }
  return NextResponse.json(result);
}
