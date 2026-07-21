import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import StatusBadge from "../components/StatusBadge";
import { formatBusinessDateTime } from "@/lib/business/time";
export default async function Page() {
  const { supabase } = await requireAdmin(),
    today = new Date(),
    end = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const [
    { count: attention },
    { count: todayCount },
    { count: unassigned },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["requested", "under_review"]),
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_start", today.toISOString())
      .lt("scheduled_start", end.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .is("assigned_provider_id", null),
    supabase
      .from("business_bookings")
      .select(
        "id,status,service,scheduled_start,properties(nickname,postcode),business_accounts(name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  return (
    <div>
      <div>
        <p className="text-sm font-black uppercase tracking-[.12em] text-[#079448]">
          Operations overview
        </p>
        <h1 className="mt-2 text-3xl font-black">What needs action today</h1>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Needs attention" value={attention || 0} tone="amber" />
        <Kpi label="Today" value={todayCount || 0} />
        <Kpi label="Unassigned" value={unassigned || 0} tone="amber" />
      </div>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Latest bookings</h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-black text-[#079448]"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
          {recent?.length ? (
            recent.map((b: any) => {
              const p = Array.isArray(b.properties)
                  ? b.properties[0]
                  : b.properties,
                a = Array.isArray(b.business_accounts)
                  ? b.business_accounts[0]
                  : b.business_accounts;
              return (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="grid gap-2 border-b p-4 last:border-0 hover:bg-[#f8faf9] sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-black">
                      {p?.nickname} · {a?.name}
                    </p>
                    <p className="text-sm text-[#657089]">
                      {formatBusinessDateTime(b.scheduled_start)} ·{" "}
                      {b.service.replaceAll("_", " ")} · {p?.postcode}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              );
            })
          ) : (
            <p className="p-8 text-center text-[#657089]">
              No business bookings yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
function Kpi({
  label,
  value,
  tone = "navy",
}: {
  label: string;
  value: number;
  tone?: "navy" | "amber";
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${tone === "amber" ? "bg-amber-50 text-amber-950" : "bg-white border"}`}
    >
      <p className="text-sm font-bold opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
