import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";

export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
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
  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="hidden text-sm font-extrabold text-[#2d67b2] sm:block">
            YOUR TEAM
          </p>
          <h1 className="text-[28px] font-extrabold leading-[34px] tracking-[-.03em] sm:mt-1 sm:text-4xl">
            Cleaners
          </h1>
          <p className="mt-2 hidden text-[#657089] sm:block">
            See who is invited and responsible for upcoming guest readiness.
          </p>
        </div>
        <Link
          href="/business/cleaners/new"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white"
        >
          <span className="sm:hidden">+ Invite</span>
          <span className="hidden sm:inline">Add cleaner</span>
        </Link>
      </header>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
        {data?.length ? (
          data.map((worker) => {
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
                ? "Paused"
                : worker.invitation_status === "pending"
                  ? "Invited"
                  : "Active";
            return (
              <Link
                key={worker.id}
                href={`/business/cleaners/${worker.id}`}
                className="rounded-xl border border-[#dfe4eb] bg-white p-4 outline-none hover:border-[#9aacc4] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#e9eff8] font-extrabold text-[#16467e]">
                    {worker.display_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-extrabold sm:text-lg">
                      {formatDisplayName(worker.display_name)}
                    </h2>
                    <p className="truncate text-sm text-[#657089]">
                      {formatDisplayName(worker.company_name) ||
                        "Independent cleaner"}
                    </p>
                  </div>
                  <span className="rounded-full border bg-[#f8fafc] px-2.5 py-1 text-xs font-extrabold">
                    {state}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-[#657089]">
                    {upcoming} upcoming{" "}
                    {upcoming === 1 ? "turnover" : "turnovers"}
                  </span>
                  <span className="font-bold text-[#245b9d]">
                    View cleaner →
                  </span>
                </div>
              </Link>
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
