import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { payoutDirectChargeBooking } from "@/lib/server/marketplace-direct-payouts";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !supplied || supplied !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: allocations, error } = await admin.from("marketplace_payout_allocations").select("booking_id").in("payout_status", ["scheduled", "held", "failed"]).not("payout_eligible_at", "is", null).lte("payout_eligible_at", now).is("stripe_payout_id", null).limit(100);
  if (error) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  const results = [];
  for (const allocation of allocations || []) {
    try { results.push({ bookingId: allocation.booking_id, ...(await payoutDirectChargeBooking(allocation.booking_id)) }); }
    catch { results.push({ bookingId: allocation.booking_id, status: "failed" }); }
  }
  return NextResponse.json({ processed: results.length, results });
}
