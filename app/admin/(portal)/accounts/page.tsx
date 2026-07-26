import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDisplayName } from "@/lib/display-name";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("business_accounts")
    .select(
      "id,name,created_at,suspended_at,business_members(full_name,role),properties(id),workers(id),work_items(id,status,turnover_date,next_checkin_at),operational_issues(id,status),activity_events(created_at)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`admin_customers_failed:${error.code}`);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-[1380px]">
      <h1 className="text-3xl font-extrabold tracking-[-.03em]">Customers</h1>
      <p className="mt-2 text-[#59677d]">
        Workspace health, upcoming arrivals and exceptions. Suspension is
        available inside the customer record.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        {data?.length ? (
          <div className="divide-y">
            {data.map((account) => {
              const owner = account.business_members?.find((member) =>
                ["owner", "admin"].includes(member.role),
              );
              const next = [...(account.work_items || [])]
                .filter(
                  (item) =>
                    item.turnover_date >= today && item.status !== "cancelled",
                )
                .sort((a, b) =>
                  a.next_checkin_at.localeCompare(b.next_checkin_at),
                )[0];
              const issues =
                account.operational_issues?.filter(
                  (issue) => !["resolved", "closed"].includes(issue.status),
                ).length || 0;
              const last = [...(account.activity_events || [])].sort((a, b) =>
                b.created_at.localeCompare(a.created_at),
              )[0];
              return (
                <Link
                  href={`/admin/accounts/${account.id}`}
                  key={account.id}
                  className="grid gap-3 p-4 hover:bg-[#f8fafc] lg:grid-cols-[minmax(210px,1fr)_160px_180px_120px_130px_20px] lg:items-center"
                >
                  <div>
                    <p className="font-extrabold">
                      {formatDisplayName(account.name)}
                    </p>
                    <p className="mt-1 text-sm text-[#657089]">
                      {formatDisplayName(owner?.full_name) ||
                        "Owner not recorded"}{" "}
                      · {account.properties.length}{" "}
                      {account.properties.length === 1
                        ? "property"
                        : "properties"}{" "}
                      · {account.workers.length}{" "}
                      {account.workers.length === 1 ? "cleaner" : "cleaners"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">
                      NEXT ARRIVAL
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {next
                        ? new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                          }).format(new Date(next.turnover_date))
                        : "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">
                      OPERATION
                    </p>
                    <p className="mt-1 text-sm font-bold capitalize">
                      {next?.status?.replaceAll("_", " ") ||
                        "No active arrival"}
                    </p>
                    <p
                      className={`text-xs font-bold ${issues ? "text-red-700" : "text-[#657089]"}`}
                    >
                      {issues} open {issues === 1 ? "issue" : "issues"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-extrabold ${account.suspended_at ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
                    >
                      {account.suspended_at ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">
                      LAST ACTIVITY
                    </p>
                    <p className="mt-1 text-sm">
                      {last
                        ? new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                          }).format(new Date(last.created_at))
                        : "—"}
                    </p>
                  </div>
                  <span>›</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-[#657089]">
            No customer accounts.
          </p>
        )}
      </div>
    </div>
  );
}
