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

export default async function Page() {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [{ data: todayItems, error }, { data: openIssues }] = await Promise.all(
    [
      supabase
        .from("work_items")
        .select(
          "id,status,turnover_date,access_start_at,window_end_at,next_checkin_at,readiness_result,properties(nickname,postcode),business_accounts(name),assignments(status,assigned_at,workers(display_name,mobile,email)),operational_issues(status,blocking)",
        )
        .eq("turnover_date", today)
        .neq("status", "cancelled")
        .order("window_end_at"),
      supabase
        .from("operational_issues")
        .select("id")
        .in("status", ["open", "acknowledged", "waiting_for_owner"])
        .eq("blocking", true),
    ],
  );
  if (error) throw new Error(`admin_operations_failed:${error.code}`);
  const items = todayItems || [];
  const urgent = items
    .map((item) => ({ item, risk: adminRisk(item, now) }))
    .filter(({ risk }) => ["critical", "high", "medium"].includes(risk.level))
    .sort((a, b) =>
      a.item.window_end_at.localeCompare(b.item.window_end_at),
    );
  const counts = {
    today: items.length,
    awaiting: items.filter((item) => item.status === "awaiting_response")
      .length,
    unassigned: items.filter((item) => item.status === "unassigned").length,
    risk: urgent.filter(({ risk }) => ["critical", "high"].includes(risk.level))
      .length,
    blocking: openIssues?.length || 0,
    ready: items.filter((item) => item.status === "ready").length,
  };
  return (
    <div className="mx-auto max-w-[1380px]">
      <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">
        Live operations
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
        Today’s readiness
      </h1>
      <p className="mt-2 text-[#59677d]">
        Find the arrival most likely to fail and intervene before the guest
        checks in.
      </p>
      <section
        aria-label="Today’s operational summary"
        className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        {[
          ["Arrivals today", counts.today, "/admin/turnovers?view=today"],
          [
            "Cleaner acceptance",
            counts.awaiting,
            "/admin/turnovers?status=awaiting_response",
          ],
          [
            "Unassigned",
            counts.unassigned,
            "/admin/turnovers?status=unassigned",
          ],
          ["At risk", counts.risk, "/admin/turnovers?view=risk"],
          ["Blocking issues", counts.blocking, "/admin/issues"],
          ["Guest ready", counts.ready, "/admin/turnovers?status=ready"],
        ].map(([label, value, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-xl border bg-white p-4 shadow-sm hover:border-[#91a4bd]"
          >
            <p className="text-xs font-bold text-[#657089]">{label}</p>
            <p className="mt-2 text-3xl font-extrabold">{value}</p>
          </Link>
        ))}
      </section>
      <section className="mt-7 overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-extrabold">Urgent now</h2>
            <p className="mt-1 text-sm text-[#657089]">
              Ordered by check-in proximity and operational risk
            </p>
          </div>
          <Link
            href="/admin/turnovers?view=risk"
            className="text-sm font-extrabold text-[#245b9d]"
          >
            Open board
          </Link>
        </div>
        {urgent.length ? (
          <div className="divide-y">
            {urgent.map(({ item, risk }) => {
              const property = Array.isArray(item.properties)
                ? item.properties[0]
                : item.properties;
              const account = Array.isArray(item.business_accounts)
                ? item.business_accounts[0]
                : item.business_accounts;
              const { worker } = adminCleaner(item);
              return (
                <article
                  key={item.id}
                  className="grid gap-4 p-4 sm:grid-cols-[120px_minmax(200px,1fr)_190px_auto] sm:items-center sm:px-5"
                >
                  <div>
                    <p className="font-extrabold">
                      {new Intl.DateTimeFormat("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      }).format(new Date(item.next_checkin_at || item.window_end_at))}
                    </p>
                    <p className="mt-1 text-xs font-bold text-red-700">
                      {checkInCountdown(item.next_checkin_at || item.window_end_at, now, item.next_checkin_at ? "check-in" : "deadline")}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-extrabold">
                      {formatDisplayName(property?.nickname)}
                    </h3>
                    <p className="mt-1 text-sm text-[#657089]">
                      {formatDisplayName(account?.name)} · {property?.postcode}
                    </p>
                    <p className="mt-2 text-sm font-bold text-red-800">
                      {risk.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#657089]">CLEANER</p>
                    <p className="mt-1 font-bold">
                      {formatDisplayName(worker?.display_name) || "Unassigned"}
                    </p>
                    <TurnoverStatus status={item.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/turnovers/${item.id}`}
                      className="inline-flex min-h-10 items-center rounded-lg bg-[#071f49] px-4 text-sm font-extrabold text-white"
                    >
                      Open arrival
                    </Link>
                    {worker?.mobile && (
                      <a
                        href={`tel:${worker.mobile}`}
                        className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-extrabold"
                      >
                        Call cleaner
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <h3 className="text-lg font-extrabold text-emerald-800">
              No urgent interventions
            </h3>
            <p className="mt-2 text-sm text-[#657089]">
              Today’s active arrivals currently have no detected readiness
              exception.
            </p>
          </div>
        )}
      </section>
      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="text-lg font-extrabold">Today’s timeline</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => {
            const p = Array.isArray(item.properties)
              ? item.properties[0]
              : item.properties;
            const risk = adminRisk(item, now);
            return (
              <Link
                href={`/admin/turnovers/${item.id}`}
                key={item.id}
                className="min-w-56 rounded-lg border p-4"
              >
                <p className="text-xs font-bold text-[#657089]">
                  {new Intl.DateTimeFormat("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/London",
                  }).format(new Date(item.next_checkin_at || item.window_end_at))}{" "}
                  {item.next_checkin_at ? "CHECK-IN" : "DEADLINE"}
                </p>
                <p className="mt-2 font-extrabold">
                  {formatDisplayName(p?.nickname)}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-extrabold ${riskTone[risk.level]}`}
                >
                  {risk.reason}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
