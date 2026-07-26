import { requireAdmin } from "@/lib/admin/auth";
import Link from "next/link";
import { adminCleaner, adminRisk, riskTone } from "@/lib/admin/operations";
import { formatDisplayName } from "@/lib/display-name";

export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,nickname,address_line_1,city,postcode,service_area_status,status,business_accounts(name),work_items(id,status,turnover_date,access_start_at,next_checkin_at,ready_at,readiness_result,assignments(status,assigned_at,workers(display_name)),operational_issues(status,blocking))",
    );
  if (error) throw new Error(`admin_properties_failed:${error.code}`);
  const now = new Date();
  const rows = (data || [])
    .map((property) => {
      const active = (property.work_items || [])
        .filter(
          (item) =>
            item.status !== "cancelled" &&
            new Date(item.next_checkin_at) >= now,
        )
        .sort((a, b) => a.next_checkin_at.localeCompare(b.next_checkin_at))[0];
      const completed = [...(property.work_items || [])]
        .filter((item) => item.status === "ready")
        .sort((a, b) => (b.ready_at || "").localeCompare(a.ready_at || ""))[0];
      return { property, active, completed };
    })
    .sort((a, b) =>
      (a.active?.next_checkin_at || "9999").localeCompare(
        b.active?.next_checkin_at || "9999",
      ),
    );
  return (
    <div className="mx-auto max-w-[1380px]">
      <h1 className="text-3xl font-extrabold tracking-[-.03em]">
        Property readiness
      </h1>
      <p className="mt-2 text-[#657089]">
        Properties with the nearest guest check-in appear first.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        {rows.length ? (
          <div className="divide-y">
            {rows.map(({ property: p, active, completed }) => {
              const account = Array.isArray(p.business_accounts)
                ? p.business_accounts[0]
                : p.business_accounts;
              const { worker, assignment } = active
                ? adminCleaner(active)
                : { worker: null, assignment: null };
              const risk = active ? adminRisk(active) : null;
              const openIssues =
                active?.operational_issues?.filter(
                  (issue) => !["resolved", "closed"].includes(issue.status),
                ).length || 0;
              return (
                <Link
                  href={`/admin/properties/${p.id}`}
                  key={p.id}
                  className="grid gap-3 p-4 hover:bg-[#f8fafc] lg:grid-cols-[minmax(210px,1fr)_180px_210px_180px_130px_20px] lg:items-center"
                >
                  <div>
                    <p className="font-extrabold">
                      {formatDisplayName(p.nickname)}
                    </p>
                    <p className="mt-1 text-sm text-[#657089]">
                      {formatDisplayName(account?.name)} · {p.postcode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">
                      NEXT CHECK-IN
                    </p>
                    <p className="mt-1 font-bold">
                      {active
                        ? new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Europe/London",
                          }).format(new Date(active.next_checkin_at))
                        : "None scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">CLEANER</p>
                    <p className="mt-1 font-bold">
                      {formatDisplayName(worker?.display_name) || "Unassigned"}
                    </p>
                    <p className="text-xs capitalize text-[#657089]">
                      {assignment?.status || "No assignment"}
                    </p>
                  </div>
                  <div>
                    {risk ? (
                      <>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-extrabold ${riskTone[risk.level]}`}
                        >
                          {risk.level}
                        </span>
                        <p className="mt-1 text-xs font-bold text-[#657089]">
                          {risk.reason}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-[#657089]">Dormant</span>
                    )}
                    <p
                      className={`mt-1 text-xs font-bold ${openIssues ? "text-red-700" : "text-[#657089]"}`}
                    >
                      {openIssues} open {openIssues === 1 ? "issue" : "issues"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">
                      LAST READY
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {completed?.ready_at
                        ? new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                          }).format(new Date(completed.ready_at))
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs capitalize text-[#657089]">
                      {p.service_area_status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span>›</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-[#657089]">No properties yet.</p>
        )}
      </div>
    </div>
  );
}
