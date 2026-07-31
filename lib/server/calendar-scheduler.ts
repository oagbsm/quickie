import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncPropertyCalendar } from "@/lib/server/property-calendars";

export async function syncDuePropertyCalendars(batchSize = 10) {
  const admin = createSupabaseAdminClient();
  const limit = Math.max(1, Math.min(batchSize, 20));
  const now = new Date().toISOString();
  const staleLease = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data, error } = await admin
    .from("property_calendar_connections")
    .select("id")
    .eq("is_active", true)
    .is("removed_at", null)
    .or(`next_sync_at.is.null,next_sync_at.lte.${now}`)
    .or(`sync_status.neq.syncing,last_sync_started_at.lt.${staleLease}`)
    .order("last_successful_sync_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(`calendar_due_query_failed:${error.code}`);
  const results: Array<{ connectionId: string; status: "ok" | "attention" }> = [];
  for (const connection of data || []) {
    try {
      const result = await syncPropertyCalendar(connection.id, admin);
      results.push({
        connectionId: connection.id,
        status: result.status === "healthy" ? "ok" : "attention",
      });
    } catch {
      results.push({ connectionId: connection.id, status: "attention" });
    }
  }
  return results;
}
