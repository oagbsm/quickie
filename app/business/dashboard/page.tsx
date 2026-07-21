import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { getBookingStatus } from "@/lib/business/booking-status";
import { formatBusinessDateTime } from "@/lib/business/time";
type Job = {
  id: string;
  service: string;
  scheduled_start: string;
  status: string;
  properties: { nickname: string } | { nickname: string }[] | null;
};
export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser(),
    now = new Date();
  const [
    { count: properties },
    { data: upcoming },
    { data: completed },
    { count: attention },
    { count: overdue },
    { data: outside },
    { data: notifications },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("status", "active"),
    supabase
      .from("business_bookings")
      .select("id,service,scheduled_start,status,properties(nickname)")
      .eq("account_id", accountId)
      .gte("scheduled_start", now.toISOString())
      .neq("status", "cancelled")
      .order("scheduled_start")
      .limit(6),
    supabase
      .from("business_bookings")
      .select("id,service,completed_at,status,properties(nickname)")
      .eq("account_id", accountId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(4),
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .in("status", ["requested", "under_review", "confirmed"]),
    supabase.from("business_bookings").select("id",{count:"exact",head:true}).eq("account_id",accountId).lt("scheduled_start",now.toISOString()).in("status",["requested","under_review","confirmed","assigned","in_progress"]),
    supabase
      .from("properties")
      .select("id,nickname,service_area_status")
      .eq("account_id", accountId)
      .neq("service_area_status", "eligible")
      .eq("status", "active"),
    supabase
      .from("business_notifications")
      .select("id,booking_id,sent_at")
      .eq("account_id", accountId)
      .eq("notification_type", "property_ready")
      .order("sent_at", { ascending: false })
      .limit(4),
  ]);
  const danger=(overdue||0)>0,warning=(attention||0)>0;
  return (
    <div>
      <div
        className={`rounded-2xl p-5 ${danger?"bg-red-50 text-red-900":warning ? "bg-amber-50 text-amber-950" : "bg-[#eaf7ef] text-[#075d35]"}`}
      >
        <p className="text-xl font-black">
          {danger?`Action required on ${overdue} booking${overdue===1?"":"s"}`:warning
            ? `${attention} booking${attention === 1 ? "" : "s"} need confirmation`
            : "Everything is on track"}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {danger?"A booking is past its requested time and needs review.":warning
            ? "Open the booking to see the latest status."
            : "Your upcoming bookings are confirmed or assigned."}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Overview</h1>
          <p className="mt-1 text-[#657089]">
            Managed property cleaning at a glance.
          </p>
        </div>
        <Link
          href="/business/bookings/new"
          className="rounded-xl bg-[#079448] px-5 py-3 font-black text-white"
        >
          Book a clean
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Properties" value={properties || 0} />
        <Stat label="Upcoming bookings" value={upcoming?.length || 0} />
        <Stat label="Need attention" value={attention || 0} />
      </div>
      {outside?.length ? (
        <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">
            Cleaning is not yet available for {outside.length}{" "}
            {outside.length === 1 ? "property" : "properties"}
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Keep the portfolio organised and join the service-area waitlist from
            Properties.
          </p>
          <Link
            href="/business/properties"
            className="mt-3 inline-block text-sm font-black text-amber-950 underline"
          >
            Review service areas
          </Link>
        </section>
      ) : null}
      <Section
        title="Upcoming bookings"
        empty="No bookings yet"
        emptyText="Book a clean for one of your properties."
      >
        {(upcoming as Job[] | null)?.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </Section>
      <Section
        title="Recently completed"
        empty="No completed cleans yet"
        emptyText="Completion reports will appear here."
      >
        {(completed as Job[] | null)?.map((j) => (
          <JobCard
            key={j.id}
            job={j}
            ready={notifications?.some((n) => n.booking_id === j.id)}
          />
        ))}
      </Section>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm font-bold text-[#657089]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
function Section({
  title,
  empty,
  emptyText,
  children,
}: {
  title: string;
  empty: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const has = Array.isArray(children) && children.length > 0;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {has ? (
          children
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
            <p className="font-black">{empty}</p>
            <p className="mt-1 text-sm text-[#657089]">{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}
function JobCard({ job, ready = false }: { job: Job; ready?: boolean }) {
  const p = Array.isArray(job.properties) ? job.properties[0] : job.properties;
  return (
    <Link
      href={`/business/bookings/${job.id}`}
      className={`grid gap-2 rounded-2xl border p-5 sm:grid-cols-[1fr_auto] sm:items-center ${ready ? "border-[#bfe5cc] bg-[#edf9f1]" : "bg-white"}`}
    >
      <div>
        {ready && (
          <p className="text-xs font-black text-[#079448]">
            YOUR PROPERTY IS READY
          </p>
        )}
        <p className="font-black">{p?.nickname || "Property"}</p>
        <p className="text-sm font-semibold text-[#657089]">
          {job.service.replaceAll("_"," ")} ·{" "}
          {formatBusinessDateTime(
            job.scheduled_start ||
              (job as unknown as { completed_at: string }).completed_at,
          )}
        </p>
      </div>
      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-[#08783f]">
        {getBookingStatus(job.status).customerLabel}
      </span>
    </Link>
  );
}
