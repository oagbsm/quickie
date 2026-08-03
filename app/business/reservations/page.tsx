import Link from "next/link";
import Image from "next/image";
import { listReservations } from "@/lib/server/reservations";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDisplayName } from "@/lib/display-name";
import ReservationStatus from "./ReservationStatus";

const views = [
  ["Upcoming", "upcoming"],
  ["Past", "past"],
  ["Cancelled", "cancelled"],
] as const;

const stayDateTime = (value: string) =>
  formatBusinessDateTime(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dateOnly = (value: string) => formatBusinessDateTime(value, { day: "numeric", month: "short" });

type SourceConnection = { provider: "airbnb" | "booking_com" | "vrbo" | "expedia" | "other"; display_name: string | null; sync_status?: string } | null;
const providerNames = { airbnb: "Airbnb", booking_com: "Booking.com", vrbo: "Vrbo", expedia: "Expedia", other: "Other" } as const;
const sourceLabel = (source: string, connection: SourceConnection) => {
  if (source === "manual") return "Manual";
  if (!connection) return "Calendar";
  return (connection.display_name || providerNames[connection.provider]).replace(/\s+calendar$/i, "");
};

function cleaningText(turnover: { turnover_date: string; access_start_at?: string | null; window_end_at?: string | null } | null) {
  if (!turnover) return null;
  if (turnover.access_start_at && turnover.window_end_at) {
    return `Cleaning · ${dateOnly(turnover.access_start_at)}, ${formatBusinessDateTime(turnover.access_start_at, { hour: "2-digit", minute: "2-digit" })}–${formatBusinessDateTime(turnover.window_end_at, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `Cleaning · ${dateOnly(`${turnover.turnover_date}T12:00:00Z`)}`;
}

function BookingIcon({ name }: { name: "calendar" | "building" | "sparkles" | "chevron" }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    building: <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1" />,
    sparkles: <><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" /><path d="m19 14 .6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14Z" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const sourceImages: Record<string, { src: string; width: number; height: number }> = {
  airbnb: { src: "/icons/airbnb.png", width: 82, height: 30 },
  booking_com: { src: "/icons/booking.jpg", width: 105, height: 27 },
  vrbo: { src: "/icons/vrbo.png", width: 82, height: 30 },
  expedia: { src: "/icons/expedia.png", width: 88, height: 28 },
};

function SourceMark({ connection, label, emphasized = false }: { connection: SourceConnection; label: string; emphasized?: boolean }) {
  const image = connection && sourceImages[connection.provider];
  if (image) return <span role="img" aria-label={label} className={`inline-flex max-w-full items-center ${emphasized ? "max-w-24" : "max-w-20"}`}><Image src={image.src} alt="" width={image.width} height={image.height} className={`${emphasized ? "max-h-7" : "max-h-6"} max-w-full object-contain`} /></span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#657089]"><BookingIcon name="calendar" /><span>{label}</span></span>;
}

function BookingSource({ row }: { row: { source: string; sourceConnection: SourceConnection } }) {
  const label = sourceLabel(row.source, row.sourceConnection);
  return <SourceMark connection={row.sourceConnection} label={label} />;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: requestedView } = await searchParams;
  const view = views.some(([, key]) => key === requestedView)
    ? (requestedView as "upcoming" | "past" | "cancelled")
    : "upcoming";
  const rows = await listReservations(view);
  const featured = view === "upcoming" ? rows[0] : null;
  const listRows = featured ? rows.slice(1) : rows;
  const conflictRowIds = new Set<string>();
  const conflictSources = new Map<string, { propertyId: string; propertyName: string; count: number; provider: string; rejected: boolean; startAt: string | null; endAt: string | null }>();
  for (const row of rows) {
    if (!row.sourceConnection?.open_overlap_count) continue;
    const key = row.property.id;
    if (!conflictSources.has(key)) {
      const rejected = row.sourceConnection.open_rejected_conflicts?.find((conflict) => conflict.startAt && conflict.endAt) || row.sourceConnection.open_rejected_conflicts?.[0];
      conflictSources.set(key, { propertyId: row.property.id, propertyName: formatDisplayName(row.property.nickname), count: row.sourceConnection.open_overlap_count, provider: sourceLabel(row.source, row.sourceConnection), rejected: true, startAt: rejected?.startAt || null, endAt: rejected?.endAt || null });
    }
  }
  for (let index = 0; index < rows.length; index += 1) {
    for (let next = index + 1; next < rows.length; next += 1) {
      const first = rows[index];
      const second = rows[next];
      if (first.property_id !== second.property_id || first.status === "cancelled" || second.status === "cancelled" || first.check_in_at >= second.check_out_at || first.check_out_at <= second.check_in_at) continue;
      const key = first.property_id;
      conflictRowIds.add(first.id);
      conflictRowIds.add(second.id);
      const existing = conflictSources.get(key);
      const count = existing?.count || 0;
      conflictSources.set(key, { propertyId: first.property_id, propertyName: formatDisplayName(first.property.nickname), count: Math.max(2, count), provider: sourceLabel(first.source, first.sourceConnection), rejected: existing?.rejected || false, startAt: existing?.startAt || null, endAt: existing?.endAt || null });
    }
  }
  const conflictSummaries = [...conflictSources.values()];
  const syncIssue = rows.find((row) => {
    const connection = row.sourceConnection;
    const issueTypes = connection?.open_issue_types || [];
    const conflictOnly = issueTypes.length > 0 && issueTypes.every((type) => type === "overlap_conflict");
    return connection?.sync_status && connection.sync_status !== "healthy" && !conflictOnly;
  });
  const syncIssueLabel = syncIssue ? sourceLabel(syncIssue.source, syncIssue.sourceConnection) : null;
  return <div className="portal-page">
    <header className="portal-header">
      <div><h1 className="portal-title">Bookings</h1><p className="portal-subtitle hidden sm:block">Manage guest stays and their linked cleans.</p></div>
      {rows.length ? <Link href="/business/reservations/new" className="portal-action"><span className="sm:hidden">+ Booking</span><span className="hidden sm:inline">Add booking</span></Link> : null}
    </header>
    <nav aria-label="Booking views" className="mt-5 grid grid-cols-3 border-b">{views.map(([label, key]) => <Link key={key} href={`/business/reservations?view=${key}`} aria-current={view === key ? "page" : undefined} className={`min-h-12 border-b-2 px-2 text-center text-sm font-extrabold leading-[46px] ${view === key ? "border-[#16467e] text-[#16467e]" : "border-transparent text-[#657089]"}`}>{label}</Link>)}</nav>
    {conflictSummaries.length > 0 && <section className="mt-4 grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" aria-label="Booking conflicts"><p className="font-extrabold">Booking conflict{conflictSummaries.length > 1 ? "s" : ""}</p>{conflictSummaries.map((summary) => <div key={`${summary.propertyId}-${summary.propertyName}`} className="flex flex-wrap items-center justify-between gap-2"><span>{summary.propertyName} · {summary.provider}{summary.startAt && summary.endAt ? ` stay · ${stayDateTime(summary.startAt)} → ${stayDateTime(summary.endAt)}` : " stay"} · {summary.rejected ? "Not imported" : `${summary.count} booking${summary.count === 1 ? "" : "s"} overlap`}</span><Link href={`/business/properties/${summary.propertyId}?tab=reservations`} className="min-h-11 inline-flex items-center font-extrabold">Review bookings →</Link></div>)}</section>}
    {syncIssue && <div role="status" className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900"><span>Calendar sync issue · {syncIssueLabel}</span><Link href={`/business/properties/${syncIssue.property.id}?tab=reservations`} className="min-h-11 shrink-0 inline-flex items-center font-extrabold">Review →</Link></div>}
    {featured && <section className="mt-4 grid gap-3" aria-labelledby="next-booking-title"><div className="flex items-center gap-2 text-sm font-extrabold text-[#16467e]"><BookingIcon name="calendar" /><h2 id="next-booking-title">Next booking</h2></div><Link href={`/business/reservations/${featured.id}`} className={`portal-card border-l-4 p-5 outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20 ${conflictRowIds.has(featured.id) ? "border-l-red-500 bg-red-50/50" : "border-l-[#2d67b2]"}`}><div className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 shrink-0 text-[#245b9d]"><BookingIcon name="building" /></span><div className="min-w-0"><p className="break-words text-lg font-extrabold">{formatDisplayName(featured.property.nickname)}</p><p className="mt-1 text-sm text-[#657089]">{featured.property.postcode}</p></div></div><div className="flex shrink-0 items-center gap-2"><BookingSource row={featured}/>{conflictRowIds.has(featured.id) && <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">Booking conflict</span>}</div></div><div className="mt-4 border-t border-[#edf0f3] pt-4"><p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#657089]">Guest stay</p><p className="mt-1 text-sm font-extrabold">{stayDateTime(featured.check_in_at)} <span aria-hidden="true">→</span> {stayDateTime(featured.check_out_at)}</p><p className="mt-3 text-sm font-bold">Checkout · {stayDateTime(featured.check_out_at)}</p>{featured.turnover && <p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#23633a]"><BookingIcon name="sparkles" />{cleaningText(featured.turnover)}</p>}</div>{!featured.turnover && featured.status !== "confirmed" ? <div className="mt-3"><ReservationStatus status={featured.status} /></div> : null}</Link></section>}
    {(listRows.length || !rows.length) && <div className="portal-panel mt-4">{listRows.length ? <div className="divide-y divide-[#e7ebf0]">
      <div className="hidden grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_170px_100px_20px] gap-4 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid"><span>Property</span><span>Stay</span><span>Cleaning</span><span>Source</span><span /></div>
      {listRows.map((row) => { const conflict = conflictRowIds.has(row.id); return <Link href={`/business/reservations/${row.id}`} key={row.id} className={`portal-list-row grid min-h-11 grid-cols-[52px_minmax(0,1fr)_20px] items-center gap-3 border-l-2 p-4 outline-none lg:grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_170px_100px_20px] lg:items-center lg:gap-4 lg:px-5 lg:py-4 ${conflict ? "border-l-red-500 bg-red-50/50" : "border-l-transparent"}`}>
        <div className="hidden lg:contents"><div><p className="break-words font-extrabold">{formatDisplayName(row.property.nickname)}</p><p className="mt-0.5 text-xs text-[#657089]">{row.property.postcode}</p></div><div className="text-sm"><p className="font-bold">{stayDateTime(row.check_in_at)} <span aria-hidden="true">→</span> {stayDateTime(row.check_out_at)}</p></div><div><p className="text-sm font-extrabold">{cleaningText(row.turnover) || "—"}</p>{!row.turnover && row.status !== "confirmed" ? <div className="mt-1"><ReservationStatus status={row.status}/></div> : null}</div><div className="text-xs font-bold text-[#657089]"><BookingSource row={row}/></div><span aria-hidden="true" className="text-xl">›</span></div>
        <div className="flex h-full flex-col justify-center text-center lg:hidden"><span className="text-xs font-extrabold uppercase text-[#657089]">{formatBusinessDateTime(row.check_in_at, { month: "short" })}</span><span className="text-xl font-extrabold text-[#16467e]">{formatBusinessDateTime(row.check_in_at, { day: "numeric" })}</span></div>
        <div className="min-w-0 lg:hidden"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-extrabold">{formatDisplayName(row.property.nickname)}</p>{conflict && <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">Booking conflict</span>}</div><p className="mt-1 text-xs text-[#657089]">{stayDateTime(row.check_in_at)} → {stayDateTime(row.check_out_at)}</p>{row.turnover && <p className="mt-1 break-words text-xs font-bold text-[#23633a]">{cleaningText(row.turnover)}</p>}<div className="mt-2 flex min-h-6 items-center"><BookingSource row={row}/>{!row.turnover && row.status !== "confirmed" ? <span className="ml-2"><ReservationStatus status={row.status}/></span> : null}</div></div>
        <span aria-hidden="true" className="text-xl text-[#657089] lg:hidden"><BookingIcon name="chevron" /></span>
      </Link>; })}
    </div> : <div className="p-8 text-center"><h2 className="text-lg font-extrabold">{view === "upcoming" ? "No upcoming bookings" : `No ${view} bookings`}</h2><p className="mt-2 text-sm text-[#657089]">{view === "upcoming" ? "Bookings from your connected calendars will appear here automatically." : "Bookings in this view will appear here."}</p>{view === "upcoming" && <p className="mt-1 text-sm text-[#657089]">You can also add a booking manually.</p>}{view === "upcoming" && <Link href="/business/reservations/new" className="portal-action mt-5">Add booking</Link>}</div>}</div>}
  </div>;
}
