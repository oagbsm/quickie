import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";
import { generateWorkerInviteLink, resendWorkerInvitation, revokeWorkerInvitation } from "../str-actions";

export default async function Page() {
  const { supabase, accountId, role } = await requireBusinessUser();
  await supabase.rpc("expire_worker_invitations", {
    target_account: accountId,
  });
  const { data } = await supabase
    .from("workers")
    .select(
      "id,display_name,company_name,email,mobile,preferred_contact_method,invitation_status,status,assignments(id,status,work_items(turnover_date,status))",
    )
    .eq("account_id", accountId)
    .order("display_name");
  const workers=data||[];const activeCount=workers.filter(w=>w.status==="active"&&w.invitation_status==="accepted").length;const pendingCount=workers.filter(w=>w.invitation_status==="pending").length;const upcomingCount=workers.reduce((total,w)=>total+(w.assignments||[]).filter(a=>{const item=Array.isArray(a.work_items)?a.work_items[0]:a.work_items;return item&&a.status==="accepted"&&!['ready','cancelled'].includes(item.status)&&item.turnover_date>=new Date().toISOString().slice(0,10)}).length,0);
  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <h1 className="portal-title">
            Cleaners
          </h1>
          <p className="portal-subtitle hidden sm:block">
            Manage the people responsible for your turnovers.
          </p>
        </div>
        <Link
          href="/business/cleaners/new"
          className="portal-action"
        >
          <span className="sm:hidden">+ Invite</span>
          <span className="hidden sm:inline">Add cleaner</span>
        </Link>
      </header>
      {workers.length>0&&<section aria-label="Cleaner summary" className="mt-5 grid grid-cols-3 gap-3">{[["Active cleaners",activeCount],["Pending invitations",pendingCount],["Upcoming assignments",upcomingCount]].map(([label,value])=><div key={label} className="portal-card p-3 sm:p-4"><p className="text-[11px] font-bold text-[#65758c] sm:text-sm">{label}</p><p className="mt-1 text-xl font-extrabold sm:text-2xl">{value}</p></div>)}</section>}
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
        {workers.length ? (
          workers.map((worker) => {
            const upcoming =
              worker.assignments?.filter((assignment) => {
                const work = Array.isArray(assignment.work_items)
                  ? assignment.work_items[0]
                  : assignment.work_items;
                return (
                  assignment.status === "accepted" &&
                  work &&
                  !["ready", "cancelled"].includes(work.status) &&
                  work.turnover_date >= new Date().toISOString().slice(0, 10)
                );
              }).length || 0;
            const state =
              worker.status !== "active"
                ? "Inactive"
                : worker.invitation_status === "pending"
                  ? "Pending invitation"
                  : "Active cleaner";
            return (
              <article
                key={worker.id}
                className="portal-card p-4 outline-none hover:border-[#b8c5d5] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#e9eff8] font-extrabold text-[#16467e]">
                    {worker.display_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-extrabold sm:text-lg"><Link href={`/business/cleaners/${worker.id}`} className="hover:underline">{formatDisplayName(worker.display_name)}</Link></h2>
                    {worker.company_name&&<p className="truncate text-sm text-[#657089]">{formatDisplayName(worker.company_name)}</p>}
                  </div>
                  <span className="portal-pill border border-slate-200 bg-slate-50 text-slate-700">
                    {state}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-[#657089]">
                    {upcoming} upcoming{" "}
                    {upcoming === 1 ? "turnover" : "turnovers"}
                  </span>
                  <Link href={`/business/cleaners/${worker.id}`} className="font-bold text-[#245b9d]">View cleaner →</Link>
                </div>
                {role === "owner" && worker.invitation_status === "pending" && <div className="mt-3 grid gap-2 border-t pt-3 text-sm"><form action={generateWorkerInviteLink}><button name="workerId" value={worker.id} className="min-h-10 w-full rounded-lg border font-bold">Generate new invite link</button></form><form action={resendWorkerInvitation}><button name="workerId" value={worker.id} className="min-h-10 w-full rounded-lg bg-[#071f49] font-bold text-white">Resend email</button></form><form action={revokeWorkerInvitation}><button name="workerId" value={worker.id} className="min-h-10 w-full font-bold text-red-700">Cancel invitation</button></form></div>}
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border bg-white p-8 text-center sm:p-10">
            <h2 className="text-xl font-extrabold">No cleaners added</h2>
            <p className="mt-2 text-[#657089]">
              Invite the cleaner or contractor you already work with.
            </p>
            <Link
              href="/business/cleaners/new"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white"
            >
              Add cleaner
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
