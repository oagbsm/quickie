import Link from "next/link";
import { listReservations } from "@/lib/server/reservations";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDisplayName } from "@/lib/display-name";
import TurnoverStatus from "../components/TurnoverStatus";
import ReservationStatus from "./ReservationStatus";

const views = [
  ["Upcoming", "upcoming"],
  ["Past", "past"],
  ["Cancelled", "cancelled"],
] as const;

const stayDateTime = (value: string) =>
  formatBusinessDateTime(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type SourceConnection = { provider: "airbnb" | "booking_com" | "vrbo" | "expedia" | "other"; display_name: string | null } | null;
const sourceLabel = (source: string, connection: SourceConnection) => {
  if (source === "manual") return "Manual";
  if (!connection) return null;
  if (connection.display_name) return connection.display_name;
  return { airbnb: "Airbnb", booking_com: "Booking.com", vrbo: "Vrbo", expedia: "Expedia", other: "Other" }[connection.provider];
};

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: requestedView } = await searchParams;
  const view = views.some(([, key]) => key === requestedView)
    ? (requestedView as "upcoming" | "past" | "cancelled")
    : "upcoming";
  const rows = await listReservations(view);
  return <div className="portal-page">
    <header className="portal-header">
      <div><h1 className="portal-title">Bookings</h1><p className="portal-subtitle hidden sm:block">Manage guest stays and their linked cleans.</p></div>
      {rows.length ? <Link href="/business/reservations/new" className="portal-action"><span className="sm:hidden">+ Booking</span><span className="hidden sm:inline">Add booking</span></Link> : null}
    </header>
    <nav aria-label="Booking views" className="mt-5 grid grid-cols-3 border-b">{views.map(([label, key]) => <Link key={key} href={`/business/reservations?view=${key}`} aria-current={view === key ? "page" : undefined} className={`min-h-12 border-b-2 px-2 text-center text-sm font-extrabold leading-[46px] ${view === key ? "border-[#16467e] text-[#16467e]" : "border-transparent text-[#657089]"}`}>{label}</Link>)}</nav>
    <div className="portal-panel mt-4">{rows.length ? <div className="divide-y divide-[#e7ebf0]">
      <div className="hidden grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_170px_100px_20px] gap-4 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid"><span>Property</span><span>Stay</span><span>Cleaning</span><span>Source</span><span /></div>
      {rows.map((row) => { const source = sourceLabel(row.source, row.sourceConnection); return <Link href={`/business/reservations/${row.id}`} key={row.id} className="portal-list-row grid gap-3 p-4 outline-none lg:grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_170px_100px_20px] lg:items-center lg:gap-4 lg:px-5 lg:py-5">
        <div className="hidden lg:contents"><div><p className="font-extrabold">{formatDisplayName(row.property.nickname)}</p><p className="mt-0.5 text-xs text-[#657089]">{row.property.postcode}</p></div><div className="text-sm"><p className="font-bold">{stayDateTime(row.check_in_at)} <span aria-hidden="true">→</span> {stayDateTime(row.check_out_at)}</p></div><div><p className="text-sm font-extrabold">{row.turnover ? <>Cleaning · {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${row.turnover.turnover_date}T12:00:00Z`))}</> : "No clean scheduled"}</p>{row.turnover ? <div className="mt-1"><TurnoverStatus status={row.turnover.status}/></div> : row.status !== "confirmed" ? <div className="mt-1"><ReservationStatus status={row.status}/></div> : null}</div><div className="text-xs font-bold text-[#657089]">{source}</div><span aria-hidden="true" className="text-xl">›</span></div>
        <div className="lg:hidden"><p className="font-extrabold">{formatDisplayName(row.property.nickname)}</p><p className="mt-4 text-sm font-bold">{stayDateTime(row.check_in_at)} <span aria-hidden="true">→</span> {stayDateTime(row.check_out_at)}</p><p className="mt-3 text-sm font-bold">{row.turnover ? <>Cleaning · {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${row.turnover.turnover_date}T12:00:00Z`))}</> : "No clean scheduled"}</p>{row.turnover ? <div className="mt-1"><TurnoverStatus status={row.turnover.status}/></div> : row.status !== "confirmed" ? <div className="mt-1"><ReservationStatus status={row.status}/></div> : null}{source && <p className="mt-3 text-xs font-bold text-[#657089]">{source}</p>}</div>
      </Link>; })}
    </div> : <div className="p-8 text-center"><h2 className="text-lg font-extrabold">{view === "upcoming" ? "No upcoming bookings" : `No ${view} bookings`}</h2><p className="mt-2 text-sm text-[#657089]">{view === "upcoming" ? "Bookings from your connected calendars will appear here automatically." : "Bookings in this view will appear here."}</p>{view === "upcoming" && <p className="mt-1 text-sm text-[#657089]">You can also add a booking manually.</p>}{view === "upcoming" && <Link href="/business/reservations/new" className="portal-action mt-5">Add booking</Link>}</div>}</div>
  </div>;
}
