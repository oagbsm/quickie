import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  activeBookingStatuses,
  formatServiceLabel,
  getDashboardBanner,
} from "@/lib/business/booking-status";
import { BookingStatusBadge } from "@/app/business/components/BookingPresentation";
import { formatBusinessDateTime } from "@/lib/business/time";

type Job = {
  id: string;
  service: string;
  scheduled_start: string;
  status: string;
  completed_at?: string | null;
  properties: { nickname: string } | { nickname: string }[] | null;
};
type PropertyRow = {
  id: string;
  nickname: string;
  postcode: string;
  service_area_status: string;
  business_bookings:
    { id: string; status: string; scheduled_start: string }[] | null;
};

export default async function Page() {
  const { supabase, accountId, user } = await requireBusinessUser();
  const now = new Date();
  const [
    { data: member },
    { data: account },
    { count: propertiesCount },
    { data: propertyRows },
    { data: upcoming },
    { count: upcomingCount },
    { data: completed },
    { count: completedCount },
    { data: attentionBookings },
  ] = await Promise.all([
    supabase
      .from("business_members")
      .select("full_name")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("business_accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle(),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("status", "active"),
    supabase
      .from("properties")
      .select(
        "id,nickname,postcode,service_area_status,business_bookings(id,status,scheduled_start)",
      )
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("business_bookings")
      .select("id,service,scheduled_start,status,properties(nickname)")
      .eq("account_id", accountId)
      .gte("scheduled_start", now.toISOString())
      .in("status", [...activeBookingStatuses])
      .order("scheduled_start")
      .limit(5),
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .gte("scheduled_start", now.toISOString())
      .in("status", [...activeBookingStatuses]),
    supabase
      .from("business_bookings")
      .select(
        "id,service,scheduled_start,completed_at,status,properties(nickname)",
      )
      .eq("account_id", accountId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("status", "completed"),
    supabase
      .from("business_bookings")
      .select("id,status")
      .eq("account_id", accountId)
      .in("status", [...activeBookingStatuses]),
  ]);
  const jobs = (upcoming || []) as Job[];
  const recent = [...jobs, ...((completed || []) as Job[])]
    .sort(
      (a, b) =>
        new Date(b.completed_at || b.scheduled_start).getTime() -
        new Date(a.completed_at || a.scheduled_start).getTime(),
    )
    .slice(0, 5);
  const actionCount = (attentionBookings || []).filter(
    (booking) => booking.status === "awaiting_customer_confirmation",
  ).length;
  const banner = getDashboardBanner(
    (attentionBookings || []).map((booking) => booking.status),
  );
  const firstName = (member?.full_name || account?.name || "there")
    .trim()
    .split(/\s+/)[0];
  return (
    <div className="mx-auto max-w-[1320px]">
      <header className="flex flex-col gap-5 border-b border-[#e3e7ec] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[clamp(1.8rem,3vw,2.35rem)] font-extrabold tracking-[-.035em]">
            Good {dayPart()}, {firstName}
          </h1>
          <p className="mt-2 text-[1.02rem] text-[#526078]">
            {banner.actionRequired
              ? banner.copy
              : "Everything is running smoothly."}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold text-[#31405b]">
            <span className="flex items-center gap-2">
              <MiniIcon name="calendar" />
              {upcomingCount || 0} upcoming{" "}
              {(upcomingCount || 0) === 1 ? "booking" : "bookings"}.
            </span>
            <span className="flex items-center gap-2">
              <MiniIcon name="shield" />
              {actionCount} {actionCount === 1 ? "action" : "actions"} required.
            </span>
          </div>
        </div>
        <Link
          href="/business/bookings/new"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#071f49] px-5 font-bold text-white shadow-[0_10px_24px_rgba(7,31,73,.16)]"
        >
          <span className="text-xl font-normal" aria-hidden="true">
            ＋
          </span>
          New request
        </Link>
      </header>

      <section
        aria-label="Account overview"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat icon="building" label="Properties" value={propertiesCount || 0} />
        <Stat
          icon="calendar"
          label="Upcoming bookings"
          value={upcomingCount || 0}
        />
        <Stat icon="check" label="Completed" value={completedCount || 0} />
        <Stat icon="alert" label="Action required" value={actionCount} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Upcoming operations"
          action={{ label: "View schedule", href: "/business/bookings" }}
        >
          {jobs.length ? (
            <div className="divide-y divide-[#e7eaee]">
              {jobs.map((job, index) => (
                <OperationRow key={job.id} job={job} first={index === 0} />
              ))}
            </div>
          ) : (
            <Empty
              title="No upcoming bookings"
              copy="Request a clean for one of your properties."
            />
          )}
        </Panel>
        <Panel
          title="Recent bookings"
          action={{ label: "View all", href: "/business/bookings" }}
        >
          {recent.length ? (
            <div className="divide-y divide-[#e7eaee]">
              {recent.map((job) => (
                <RecentRow key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Empty
              title="No bookings yet"
              copy="Your booking activity will appear here."
            />
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]">
        <Panel
          title="Your properties"
          action={{
            label: "View all properties",
            href: "/business/properties",
          }}
        >
          {propertyRows?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="bg-[#f3f5f8] text-xs text-[#526078]">
                    <th className="rounded-l-lg px-4 py-3 font-bold">
                      Property
                    </th>
                    <th className="px-4 py-3 font-bold">Postcode</th>
                    <th className="px-4 py-3 font-bold">Next clean</th>
                    <th className="rounded-r-lg px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7eaee]">
                  {(propertyRows as PropertyRow[]).map((property) => (
                    <PropertyTableRow key={property.id} property={property} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No properties yet"
              copy="Add your first property to start requesting cleans."
            />
          )}
        </Panel>
        <aside
          className={`rounded-xl border p-6 ${banner.actionRequired ? "border-amber-200 bg-amber-50" : "border-[#dfe5e9] bg-white"}`}
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-full text-xl ${banner.actionRequired ? "bg-amber-100 text-amber-800" : "bg-[#e7f7ed] text-[#07833f]"}`}
            aria-hidden="true"
          >
            {banner.actionRequired ? "!" : "✓"}
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-[-.02em]">
            {banner.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#526078]">{banner.copy}</p>
          <Link
            href={actionCount ? "/business/bookings" : "/business/properties"}
            className="mt-6 inline-flex text-sm font-bold text-[#075fe4]"
          >
            {actionCount ? "Review bookings" : "View properties"}{" "}
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function dayPart() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-h-32 items-center gap-5 rounded-xl border border-[#dfe5e9] bg-white p-5 shadow-[0_8px_25px_rgba(7,22,56,.035)]">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#f0f3f7] text-[#071f49]">
        <MiniIcon name={icon} large />
      </span>
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-[-.03em]">
          {value}
        </p>
      </div>
    </div>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#dfe5e9] bg-white p-5 shadow-[0_8px_25px_rgba(7,22,56,.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-extrabold">{title}</h2>
        {action && (
          <Link href={action.href} className="text-sm font-bold text-[#075fe4]">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
function OperationRow({ job, first }: { job: Job; first: boolean }) {
  const property = Array.isArray(job.properties)
    ? job.properties[0]
    : job.properties;
  return (
    <Link
      href={`/business/bookings/${job.id}`}
      className="grid grid-cols-[4.7rem_1fr] gap-3 py-3 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center"
    >
      <time className="text-sm font-semibold text-[#31405b]">
        {formatBusinessDateTime(job.scheduled_start).split(",").at(-1)?.trim()}
      </time>
      <div>
        <p className="font-bold">{property?.nickname || "Property"}</p>
        <p className="mt-0.5 text-sm text-[#526078]">
          {formatServiceLabel(job.service)}
        </p>
      </div>
      <span
        className={`col-start-2 text-sm font-bold sm:col-auto ${first ? "text-[#07833f]" : "text-[#075fe4]"}`}
      >
        {first ? "Next booking" : "Scheduled"}
      </span>
    </Link>
  );
}
function RecentRow({ job }: { job: Job }) {
  const property = Array.isArray(job.properties)
    ? job.properties[0]
    : job.properties;
  return (
    <Link
      href={`/business/bookings/${job.id}`}
      className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-5"
    >
      <div>
        <p className="font-bold">{property?.nickname || "Property"}</p>
        <p className="text-sm text-[#526078]">
          {formatServiceLabel(job.service)}
        </p>
      </div>
      <time className="text-sm text-[#31405b]">
        {formatBusinessDateTime(job.completed_at || job.scheduled_start)}
      </time>
      <BookingStatusBadge status={job.status} />
    </Link>
  );
}
function PropertyTableRow({ property }: { property: PropertyRow }) {
  const next = (property.business_bookings || [])
    .filter(
      (b) =>
        activeBookingStatuses.includes(b.status as never) &&
        new Date(b.scheduled_start) > new Date(),
    )
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start))[0];
  return (
    <tr>
      <td className="px-4 py-3">
        <Link
          href={`/business/properties/${property.id}`}
          className="font-bold"
        >
          {property.nickname}
        </Link>
      </td>
      <td className="px-4 py-3 text-[#526078]">{property.postcode}</td>
      <td className="px-4 py-3 text-[#31405b]">
        {next ? formatBusinessDateTime(next.scheduled_start) : "No booking"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${property.service_area_status === "eligible" ? "bg-[#e5f7eb] text-[#08783f]" : "bg-amber-100 text-amber-900"}`}
        >
          {property.service_area_status === "eligible"
            ? "Ready"
            : "Coverage review"}
        </span>
      </td>
    </tr>
  );
}
function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-lg bg-[#f7f8fa] p-6 text-center">
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-[#657089]">{copy}</p>
      </div>
    </div>
  );
}
function MiniIcon({ name, large = false }: { name: string; large?: boolean }) {
  const paths: Record<string, React.ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 3 8v8l9 5 9-5V8Z" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={large ? "h-7 w-7" : "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
