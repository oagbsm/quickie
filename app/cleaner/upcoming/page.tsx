import { requireCleanerUser } from "@/lib/cleaner/auth";
import TurnoverCards from "../TurnoverCards";
import CleanerNavigation from "../CleanerNavigation";

export default async function Page() {
  const { supabase, workerId } = await requireCleanerUser();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("work_items").select("id,property_public_name,property_general_area,turnover_date,access_start_at,window_end_at,next_checkin_at,estimated_duration_minutes,cleaning_type,status,properties(nickname,postcode),assignments!inner(status,worker_id)").gt("turnover_date", today).not("status", "in", "(ready,cancelled)").eq("assignments.worker_id", workerId).order("access_start_at");
  return <><p className="text-sm font-extrabold text-[#2d67b2]">YOUR WORK</p><h1 className="mt-1 text-3xl font-extrabold">Upcoming</h1><p className="mt-2 text-sm text-[#657089]">Your assigned turnovers, with the next action shown on each card.</p><TurnoverCards items={data || []} empty="No upcoming turnovers assigned." /><CleanerNavigation /></>;
}
