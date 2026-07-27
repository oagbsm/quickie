import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import TurnoverStatus from "@/app/business/components/TurnoverStatus";
import {
  adminCleaner,
  adminRisk,
  checkInCountdown,
  riskTone,
} from "@/lib/admin/operations";
import { formatDisplayName } from "@/lib/display-name";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; q?: string }>;
}) {
  const params = await searchParams,
    { supabase } = await requireAdmin(),
    today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("work_items")
    .select(
      "id,status,turnover_date,access_start_at,window_end_at,next_checkin_at,readiness_result,properties(nickname,postcode),business_accounts(name),assignments(status,assigned_at,workers(display_name,mobile,email)),operational_issues(status,blocking)",
    )
    .order("window_end_at");
  if (params.status) query = query.eq("status", params.status);
  else if (params.view !== "diagnostics")
    query = query.neq("status", "cancelled");
  if (params.view === "today") query = query.eq("turnover_date", today);
  const { data, error } = await query;
  if (error) throw new Error(`admin_arrivals_failed:${error.code}`);
  const rows = (data || []).filter((item) => {
    if (params.view === "diagnostics")
      return item.status === "cancelled" || item.turnover_date > "2028-07-26";
    if (params.view === "overdue")
      return (
        item.turnover_date < today &&
        !["ready", "cancelled"].includes(item.status)
      );
    if (params.view === "risk")
      return ["critical", "high"].includes(adminRisk(item).level);
    if (params.q) {
      const p = Array.isArray(item.properties)
          ? item.properties[0]
          : item.properties,
        a = Array.isArray(item.business_accounts)
          ? item.business_accounts[0]
          : item.business_accounts;
      return `${p?.nickname} ${p?.postcode} ${a?.name}`
        .toLowerCase()
        .includes(params.q.toLowerCase());
    }
    return true;
  });
  return (
    <div className="mx-auto max-w-[1380px]">
      <h1 className="text-3xl font-extrabold tracking-[-.03em]">
        Arrival operations
      </h1>
      <p className="mt-2 text-[#59677d]">
        A dispatch board ordered around check-in risk, cleaner response and
        readiness evidence.
      </p>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {[
          ["", "Active"],
          ["today", "Today"],
          ["risk", "At risk"],
          ["overdue", "Overdue"],
          ["diagnostics", "Diagnostics"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/turnovers?view=${value}` : "/admin/turnovers"}
            className={`min-h-10 shrink-0 rounded-lg border px-3 py-2 text-sm font-extrabold ${params.view === value || (!params.view && !value) ? "border-[#071f49] bg-[#071f49] text-white" : "bg-white"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <input type="hidden" name="view" value={params.view || ""} />
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Property, postcode or customer"
          className="min-h-11 rounded-lg border bg-white px-3"
        />
        <select
          name="status"
          defaultValue={params.status || ""}
          className="min-h-11 rounded-lg border bg-white px-3"
        >
          <option value="">All statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="awaiting_response">Awaiting response</option>
          <option value="action_required">Action required</option>
          <option value="evidence_submitted">Evidence pending</option>
          <option value="ready">Ready</option>
        </select>
        <button className="rounded-lg border bg-white px-4 font-bold">
          Filter
        </button>
      </form>
      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        {rows.length ? (
          <div className="divide-y">
            {rows.map((item) => {
              const property = Array.isArray(item.properties)
                  ? item.properties[0]
                  : item.properties,
                account = Array.isArray(item.business_accounts)
                  ? item.business_accounts[0]
                  : item.business_accounts,
                { worker, assignment } = adminCleaner(item),
                risk = adminRisk(item);
              return (
                <Link
                  href={`/admin/turnovers/${item.id}`}
                  key={item.id}
                  className="grid gap-3 p-4 hover:bg-[#f8fafc] lg:grid-cols-[140px_minmax(220px,1fr)_180px_190px_150px_20px] lg:items-center"
                >
                  <div>
                    <p className="font-extrabold">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(item.turnover_date))}
                    </p>
                    <p className="text-xs font-bold text-[#657089]">
                      {checkInCountdown(item.next_checkin_at || item.window_end_at, new Date(), item.next_checkin_at ? "check-in" : "deadline")}
                    </p>
                  </div>
                  <div>
                    <p className="font-extrabold">
                      {formatDisplayName(property?.nickname)}
                    </p>
                    <p className="text-sm text-[#657089]">
                      {formatDisplayName(account?.name)} · {property?.postcode}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p>
                      Access{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      }).format(new Date(item.access_start_at))}
                    </p>
                    <p className="font-bold">
                      {item.next_checkin_at ? "Check-in" : "Deadline"}{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      }).format(new Date(item.next_checkin_at || item.window_end_at))}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold">
                      {formatDisplayName(worker?.display_name) || "Unassigned"}
                    </p>
                    <p className="text-xs capitalize text-[#657089]">
                      {assignment?.status || "No assignment"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-extrabold ${riskTone[risk.level]}`}
                    >
                      {risk.level === "ready" ? "Ready" : risk.level}
                    </span>
                    <p className="mt-1 text-xs font-bold text-[#657089]">
                      {risk.reason}
                    </p>
                  </div>
                  <span aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-[#59677d]">
            No arrivals match this operational view.
          </p>
        )}
      </div>
    </div>
  );
}
