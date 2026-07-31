import { createSupabaseServerClient } from "@/lib/supabase/server";
import TurnoverCards from "../TurnoverCards";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: worker } = user
    ? await supabase.from("workers").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const today = new Date().toISOString().slice(0, 10);
  const { data } = worker
    ? await supabase.from("work_items").select("id,property_public_name,property_general_area,turnover_date,access_start_at,window_end_at,next_checkin_at,estimated_duration_minutes,cleaning_type,status,properties(nickname,postcode),assignments!inner(status,worker_id)").eq("turnover_date", today).eq("assignments.worker_id", worker.id).order("access_start_at")
    : { data: [] };
  return <><p className="text-sm font-extrabold text-[#2d67b2]">YOUR WORK</p><h1 className="mt-1 text-3xl font-extrabold">Today</h1><p className="mt-2 text-sm text-[#657089]">Open a turnover to see the one next step you need to take.</p><TurnoverCards items={data || []} empty="No turnovers assigned today. Check Upcoming for your next assignment." /></>;
}
