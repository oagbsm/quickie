import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { adminRevokeWorkerInvitation } from "@/app/admin/actions";
import { formatDisplayName } from "@/lib/display-name";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "active" } = await searchParams,
    { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("workers")
    .select(
        "id,account_id,display_name,company_name,email,mobile,status,invitation_status,created_at,business_accounts(name),assignments(id,status,assigned_at,responded_at,work_items(id,status,turnover_date,access_start_at,next_checkin_at))",
    )
    .order("display_name");
  if (error) throw new Error(`admin_team_failed:${error.code}`);
  const workers = (data || []).filter((worker) =>
    view === "invitations"
      ? worker.invitation_status !== "accepted"
      : worker.invitation_status === "accepted",
  );
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-3xl font-extrabold tracking-[-.03em]">
        Cleaner operations
      </h1>
      <p className="mt-2 text-[#59677d]">
        Customer-owned cleaners, their live assignments and invitation access.
      </p>
      <nav className="mt-5 flex border-b">
        <Link
          href="/admin/cleaners"
          className={`min-h-11 border-b-2 px-4 py-3 text-sm font-extrabold ${view === "active" ? "border-[#16467e] text-[#16467e]" : "border-transparent text-[#657089]"}`}
        >
          Active cleaners
        </Link>
        <Link
          href="/admin/cleaners?view=invitations"
          className={`min-h-11 border-b-2 px-4 py-3 text-sm font-extrabold ${view === "invitations" ? "border-[#16467e] text-[#16467e]" : "border-transparent text-[#657089]"}`}
        >
          Invitations
        </Link>
      </nav>
      <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-white">
        {workers.length ? (
          workers.map((worker) => {
            const account = Array.isArray(worker.business_accounts)
              ? worker.business_accounts[0]
              : worker.business_accounts;
            const assignments = worker.assignments || [],
              accepted = assignments.filter(
                (a) => a.status === "accepted",
              ).length,
              completed = assignments.filter((a) => {
                const work = Array.isArray(a.work_items)
                  ? a.work_items[0]
                  : a.work_items;
                return work?.status === "ready";
              }).length,
              upcoming = assignments
                .filter((a) => {
                  const work = Array.isArray(a.work_items)
                    ? a.work_items[0]
                    : a.work_items;
                  return (
                    work &&
                    work.turnover_date >= today &&
                    !["ready", "cancelled"].includes(work.status)
                  );
                })
                .sort((a, b) => {
                  const aw = Array.isArray(a.work_items)
                      ? a.work_items[0]
                      : a.work_items,
                    bw = Array.isArray(b.work_items)
                      ? b.work_items[0]
                      : b.work_items;
                  return (aw?.access_start_at || "").localeCompare(
                    bw?.access_start_at || "",
                  );
                });
            const next = upcoming[0],
              nextWork = next
                ? Array.isArray(next.work_items)
                  ? next.work_items[0]
                  : next.work_items
                : null;
            return (
              <article
                key={worker.id}
                className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,1fr)_170px_110px_110px_190px_auto] lg:items-center"
              >
                <div>
                  <p className="font-extrabold">
                    {formatDisplayName(worker.display_name)}
                  </p>
                  <p className="text-sm text-[#657089]">
                    {formatDisplayName(worker.company_name) ||
                      "Independent cleaner"}{" "}
                    · {formatDisplayName(account?.name)}
                  </p>
                  <p className="mt-1 text-xs text-[#657089]">
                    {worker.email || worker.mobile}
                  </p>
                </div>
                {view === "invitations" ? (
                  <>
                    <p className="text-sm font-bold capitalize">
                      {worker.invitation_status.replaceAll("_", " ")}
                    </p>
                    <p className="text-sm text-[#657089]">
                      Invited{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                      }).format(new Date(worker.created_at))}
                    </p>
                    <span />
                    <span />
                    {worker.invitation_status === "pending" ? (
                      <form action={adminRevokeWorkerInvitation}>
                        <input
                          type="hidden"
                          name="accountId"
                          value={worker.account_id}
                        />
                        <button
                          name="workerId"
                          value={worker.id}
                          className="min-h-10 rounded-lg border px-3 text-sm font-bold text-red-700"
                        >
                          Revoke
                        </button>
                      </form>
                    ) : (
                      <span />
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-bold text-[#657089]">
                        CURRENT STATE
                      </p>
                      <p className="mt-1 font-bold">
                        {upcoming.some((a) => {
                          const w = Array.isArray(a.work_items)
                            ? a.work_items[0]
                            : a.work_items;
                          return w?.status === "in_progress";
                        })
                          ? "On site"
                          : upcoming.length
                            ? "Assigned"
                            : "No upcoming work"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#657089]">
                        ACCEPTED
                      </p>
                      <p className="mt-1 text-xl font-extrabold">{accepted}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#657089]">
                        COMPLETED
                      </p>
                      <p className="mt-1 text-xl font-extrabold">{completed}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#657089]">
                        NEXT JOB
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {nextWork
                          ? new Intl.DateTimeFormat("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Europe/London",
                            }).format(new Date(nextWork.access_start_at))
                          : "None"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-center text-xs font-extrabold ${worker.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-100"}`}
                    >
                      {worker.status}
                    </span>
                  </>
                )}
              </article>
            );
          })
        ) : (
          <p className="p-10 text-center text-[#59677d]">
            No cleaners in this view.
          </p>
        )}
      </div>
    </div>
  );
}
