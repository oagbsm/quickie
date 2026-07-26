import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { checkInCountdown } from "@/lib/admin/operations";
import { formatDisplayName } from "@/lib/display-name";
import { adminClaimIssue } from "@/app/admin/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams,
    { supabase } = await requireAdmin(),
    now = new Date();
  let query = supabase
    .from("operational_issues")
    .select(
      "id,account_id,work_item_id,issue_type,severity,status,blocking,description,created_at,assigned_admin_id,work_items(next_checkin_at,properties(nickname),business_accounts(name))",
    );
  query =
    view === "resolved"
      ? query.in("status", ["resolved", "closed"])
      : query.in("status", ["open", "acknowledged", "waiting_for_owner"]);
  const { data, error } = await query;
  if (error) throw new Error(`admin_issues_failed:${error.code}`);
  const rows = (data || []).sort(
    (a, b) =>
      Number(b.blocking) - Number(a.blocking) ||
      (
        (Array.isArray(a.work_items) ? a.work_items[0] : a.work_items)
          ?.next_checkin_at || ""
      ).localeCompare(
        (Array.isArray(b.work_items) ? b.work_items[0] : b.work_items)
          ?.next_checkin_at || "",
      ) ||
      a.created_at.localeCompare(b.created_at),
  );
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Operational issues</h1>
          <p className="mt-2 text-[#59677d]">
            Blocking issues are ordered by check-in proximity, then age.
          </p>
        </div>
        <nav className="flex rounded-lg bg-[#e8edf3] p-1 text-sm font-bold">
          <Link
            href="/admin/issues"
            className={`rounded-md px-3 py-2 ${view !== "resolved" ? "bg-white shadow" : ""}`}
          >
            Open
          </Link>
          <Link
            href="/admin/issues?view=resolved"
            className={`rounded-md px-3 py-2 ${view === "resolved" ? "bg-white shadow" : ""}`}
          >
            Resolved
          </Link>
        </nav>
      </div>
      <div className="mt-6 divide-y overflow-hidden rounded-xl border bg-white">
        {rows.length ? (
          rows.map((issue) => {
            const work = Array.isArray(issue.work_items)
                ? issue.work_items[0]
                : issue.work_items,
              property = Array.isArray(work?.properties)
                ? work.properties[0]
                : work?.properties,
              account = Array.isArray(work?.business_accounts)
                ? work.business_accounts[0]
                : work?.business_accounts;
            const age = Math.max(
              1,
              Math.floor(
                (now.getTime() - new Date(issue.created_at).getTime()) / 3600000,
              ),
            );
            return (
              <article
                key={issue.id}
                className={`grid gap-3 p-4 hover:bg-[#f8fafc] lg:grid-cols-[120px_minmax(250px,1fr)_190px_170px_auto] lg:items-center ${issue.blocking ? "border-l-4 border-l-red-700" : ""}`}
              >
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${issue.blocking ? "bg-red-700 text-white" : "bg-amber-100 text-amber-950"}`}
                  >
                    {issue.blocking ? "BLOCKING" : issue.severity.toUpperCase()}
                  </span>
                  <p className="mt-1 text-xs font-bold text-[#657089]">
                    {age}h open
                  </p>
                </div>
                <div>
                  <p className="font-extrabold">
                    {issue.issue_type} — {formatDisplayName(property?.nickname)}
                  </p>
                  <p className="mt-1 text-sm text-[#657089]">
                    {formatDisplayName(account?.name)} · {issue.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#657089]">
                    NEXT CHECK-IN
                  </p>
                  <p className="mt-1 font-bold">
                    {work?.next_checkin_at
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Europe/London",
                        }).format(new Date(work.next_checkin_at))
                      : "—"}
                  </p>
                  <p className="text-xs font-bold text-red-700">
                    {work?.next_checkin_at &&
                      checkInCountdown(work.next_checkin_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#657089]">
                    REPORTED BY
                  </p>
                  <p className="mt-1 font-bold">
                    Not recorded
                  </p>
                  <p className="text-xs text-[#657089]">
                    {issue.assigned_admin_id ? "Owned by an administrator" : "No admin owner assigned"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!issue.assigned_admin_id && view !== "resolved" && <form action={adminClaimIssue}><input type="hidden" name="issueId" value={issue.id}/><input type="hidden" name="workItemId" value={issue.work_item_id}/><input type="hidden" name="accountId" value={issue.account_id}/><button className="min-h-10 rounded-lg border px-3 text-sm font-extrabold">Claim issue</button></form>}
                  <Link href={`/admin/turnovers/${issue.work_item_id}`} className="inline-flex min-h-10 items-center rounded-lg bg-[#071f49] px-3 text-sm font-extrabold text-white">Open →</Link>
                </div>
              </article>
            );
          })
        ) : (
          <p className="p-10 text-center text-[#657089]">
            No issues in this view.
          </p>
        )}
      </div>
    </div>
  );
}
