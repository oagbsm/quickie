import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { setAccountSuspension } from "@/app/admin/actions";
import { formatDisplayName } from "@/lib/display-name";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    { supabase } = await requireAdmin();
  const { data: a } = await supabase
    .from("business_accounts")
    .select(
      "id,name,created_at,suspended_at,business_members(full_name,role),properties(id,nickname,status),workers(id,display_name,status),work_items(id,turnover_date,status,window_end_at,next_checkin_at,properties(nickname)),operational_issues(id,status,blocking,description,work_item_id),activity_events(id,description,created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();
  const owner = a.business_members?.find((m) =>
    ["owner", "admin"].includes(m.role),
  );
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/accounts" className="text-sm font-bold text-[#526078]">
        ← Customers
      </Link>
      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">
            {formatDisplayName(a.name)}
          </h1>
          <p className="mt-2 text-[#657089]">
            {formatDisplayName(owner?.full_name) || "Owner not recorded"} ·
            Customer since{" "}
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
              new Date(a.created_at),
            )}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-extrabold ${a.suspended_at ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {a.suspended_at ? "Suspended" : "Active"}
        </span>
      </header>
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Properties", a.properties.length],
          ["Cleaners", a.workers.length],
          [
            "Open issues",
            a.operational_issues.filter(
              (i) => !["resolved", "closed"].includes(i.status),
            ).length,
          ],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-white p-5">
            <p className="text-sm font-bold text-[#657089]">{l}</p>
            <p className="mt-2 text-3xl font-extrabold">{v}</p>
          </div>
        ))}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border bg-white">
          <h2 className="border-b p-4 text-lg font-extrabold">
            Upcoming arrivals
          </h2>
          <div className="divide-y">
            {a.work_items
              .filter((w) => w.status !== "cancelled")
              .sort((x, y) =>
                x.window_end_at.localeCompare(y.window_end_at),
              )
              .slice(0, 8)
              .map((w) => {
                const p = Array.isArray(w.properties)
                  ? w.properties[0]
                  : w.properties;
                return (
                  <Link
                    href={`/admin/turnovers/${w.id}`}
                    key={w.id}
                    className="flex justify-between gap-3 p-4 hover:bg-[#f8fafc]"
                  >
                    <span className="font-bold">
                      {formatDisplayName(p?.nickname)}
                    </span>
                    <span className="text-sm capitalize text-[#657089]">
                      {w.status.replaceAll("_", " ")}
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>
        <aside className="grid content-start gap-5">
          <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-extrabold text-red-800">
              Account controls
            </summary>
            <form action={setAccountSuspension} className="mt-4 grid gap-3">
              <input type="hidden" name="accountId" value={a.id} />
              <input
                type="hidden"
                name="suspend"
                value={a.suspended_at ? "0" : "1"}
              />
              {!a.suspended_at && (
                <input
                  name="reason"
                  required
                  minLength={5}
                  placeholder="Required suspension reason"
                  className="min-h-11 rounded-lg border px-3"
                />
              )}
              <button
                className={`min-h-11 rounded-lg border px-3 font-bold ${a.suspended_at ? "text-emerald-800" : "text-red-700"}`}
              >
                {a.suspended_at ? "Reactivate workspace" : "Suspend workspace"}
              </button>
            </form>
          </details>
          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-extrabold">Recent activity</h2>
            <div className="mt-3 divide-y">
              {[...a.activity_events]
                .sort((x, y) => y.created_at.localeCompare(x.created_at))
                .slice(0, 5)
                .map((e) => (
                  <div key={e.id} className="py-3">
                    <p className="text-sm font-bold">{e.description}</p>
                    <p className="mt-1 text-xs text-[#657089]">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(e.created_at))}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
