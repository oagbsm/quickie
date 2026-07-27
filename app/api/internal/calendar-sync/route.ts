import { timingSafeEqual } from "node:crypto";
import { syncDuePropertyCalendars } from "@/lib/server/calendar-scheduler";

export const runtime = "nodejs";

function authorised(request: Request) {
  const secret = process.env.CALENDAR_SYNC_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !supplied) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(supplied);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorised(request))
    return Response.json({ ok: false, error: "unauthorised" }, { status: 401 });
  try {
    const results = await syncDuePropertyCalendars(10);
    const summary = {
      processed: results.length,
      healthy: results.filter((result) => result.status === "ok").length,
      attention: results.filter((result) => result.status === "attention").length,
    };
    console.info(JSON.stringify({ event: "calendar_sync_batch_completed", ...summary }));
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "calendar_sync_batch_failed",
        error: error instanceof Error ? error.message.split(":")[0] : "unknown",
      }),
    );
    return Response.json({ ok: false, error: "calendar_sync_failed" }, { status: 500 });
  }
}
