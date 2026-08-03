import Link from "next/link";
import { notFound } from "next/navigation";
import { getReservationDetail } from "@/lib/server/reservations";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDisplayName } from "@/lib/display-name";
import {
  formatReservationEvent,
  isSameLondonDate,
} from "@/lib/reservations/presentation";
import ReservationStatus from "../ReservationStatus";
import CancelReservation from "../CancelReservation";
import { reservationSourceLabel } from "@/lib/reservations/source";

const sourceName = (source: string, connection: Parameters<typeof reservationSourceLabel>[1]) =>
  reservationSourceLabel(source, connection).replace(/\s+calendar$/i, "");
const dateTime = (value: string) => formatBusinessDateTime(value, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dateOnly = (value: string) => formatBusinessDateTime(value, { weekday: "short", day: "numeric", month: "short" });
const timeOnly = (value: string) => formatBusinessDateTime(value, { hour: "2-digit", minute: "2-digit" });

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    unchanged?: string;
    cancelled?: string;
    error?: string;
  }>;
}) {
  const { id } = await params;
  const message = await searchParams;
  const reservation = await getReservationDetail(id);
  if (!reservation) notFound();
  const turnover = reservation.turnover;
  const sourceLabel = sourceName(reservation.source, reservation.sourceConnection);
  const sameDay = turnover
    ? isSameLondonDate(turnover.guest_checkout_at, turnover.next_checkin_at)
    : false;
  const success = message.created
    ? "Booking created with one linked clean."
    : message.updated
      ? "Booking and linked clean updated."
      : message.unchanged
        ? "No reservation changes were needed."
        : message.cancelled
          ? "Booking and linked clean cancelled."
          : null;
  const cleaningDate = turnover ? dateOnly(`${turnover.turnover_date}T12:00:00Z`) : null;
  return (
    <div className="portal-page max-w-5xl">
      <Link href="/business/reservations" className="text-sm font-bold text-[#526078]">
        ← Bookings
      </Link>
      <header className="mt-4 flex flex-col gap-4 border-b border-[#dfe4eb] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase text-[#2d67b2]">{sourceLabel}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em]">{formatDisplayName(reservation.property.nickname)}</h1>
          {(reservation.guest_name || reservation.guest_count) && <p className="mt-2 text-sm text-[#657089]">{reservation.guest_name}{reservation.guest_name && reservation.guest_count ? " · " : ""}{reservation.guest_count ? `${reservation.guest_count} guests` : ""}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReservationStatus status={reservation.status} />
          {reservation.status !== "cancelled" && reservation.source === "manual" && (
            <>
              <Link href={`/business/reservations/${id}/edit`} className="portal-action-secondary">Edit reservation</Link>
              <CancelReservation reservationId={id} propertyName={reservation.property.nickname} />
            </>
          )}
        </div>
      </header>
      {success && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-800">{success}</p>}
      {message.error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 font-bold text-red-800">{message.error}</p>}
      <main className="mt-6 grid content-start gap-5">
        {reservation.conflictingReservations.length > 0 && <section className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950" aria-label="Booking conflict"><h2 className="font-extrabold">Booking conflict</h2><p className="text-sm">This guest stay overlaps another booking at {formatDisplayName(reservation.property.nickname)}.</p>{reservation.conflictingReservations.map((conflict) => <div key={conflict.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-2 text-sm"><span><strong>{sourceName(conflict.source, conflict.sourceConnection)}</strong> · {formatBusinessDateTime(conflict.check_in_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} → {formatBusinessDateTime(conflict.check_out_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><Link href={`/business/reservations/${conflict.id}`} className="min-h-11 inline-flex items-center font-extrabold">View conflicting booking →</Link></div>)}</section>}
        <section className="portal-card p-5 sm:p-6" aria-labelledby="guest-stay-title">
          <p className="text-sm font-extrabold uppercase tracking-[.08em] text-[#657089]">{dateOnly(reservation.check_in_at)}–{dateOnly(reservation.check_out_at)}</p>
          <h2 id="guest-stay-title" className="mt-1 text-xl font-extrabold">Guest stay</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><p className="portal-label">Check-in</p><p className="mt-1 text-lg font-extrabold text-[#071f49]">{dateTime(reservation.check_in_at)}</p></div>
            <div><p className="portal-label">Check-out</p><p className="mt-1 text-lg font-extrabold text-[#071f49]">{dateTime(reservation.check_out_at)}</p></div>
          </div>
        </section>
        <section className="portal-card p-5 sm:p-6" aria-labelledby="cleaning-after-checkout-title">
          <h2 id="cleaning-after-checkout-title" className="text-xl font-extrabold">Cleaning after checkout</h2>
          {turnover ? <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><p className="portal-label">Cleaning window</p><p className="mt-1 text-lg font-extrabold text-[#23633a]">{turnover.access_start_at && turnover.window_end_at ? `${cleaningDate} · ${timeOnly(turnover.access_start_at)}–${timeOnly(turnover.window_end_at)}` : `Cleaning · ${cleaningDate}`}</p></div>
              {turnover.next_checkin_at && <div><p className="portal-label">Next guest</p><p className="mt-1 text-lg font-extrabold text-[#071f49]">{dateTime(turnover.next_checkin_at)}</p></div>}
            </div>
            {sameDay && <p className="mt-4 text-sm font-bold text-[#657089]">Same-day checkout, cleaning, and next guest transition.</p>}
            {turnover.requires_attention && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">Cleaning timing needs attention.</p>}
            <Link href={`/business/turnovers/${turnover.id}`} className="portal-action-secondary mt-5 inline-flex min-h-11 items-center">View clean →</Link>
          </> : <p className="mt-4 text-sm text-[#657089]">No linked clean is available for this booking.</p>}
        </section>
        <details className="portal-card p-5 sm:p-6">
          <summary className="min-h-11 cursor-pointer list-none text-lg font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20">Booking details</summary>
          <dl className="mt-5 grid gap-4 border-t border-[#e7ebf0] pt-5 sm:grid-cols-2">
            <div><dt className="portal-label">Source</dt><dd className="mt-1 font-bold">{sourceLabel}</dd></div>
            {reservation.source === "ical" && <div><dt className="portal-label">Imported via</dt><dd className="mt-1 font-bold">Connected calendar</dd></div>}
            {reservation.sourceConnection?.last_successful_sync_at && <div><dt className="portal-label">Last synced</dt><dd className="mt-1 font-bold">{formatBusinessDateTime(reservation.sourceConnection.last_successful_sync_at)}</dd></div>}
            <div><dt className="portal-label">Created</dt><dd className="mt-1 font-bold">{formatBusinessDateTime(reservation.created_at)}</dd></div>
          </dl>
        </details>
        <details className="portal-card p-5 sm:p-6">
          <summary className="min-h-11 cursor-pointer list-none text-lg font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20">Activity &amp; history <span className="ml-1 text-sm font-bold text-[#657089]">{reservation.events.length} {reservation.events.length === 1 ? "event" : "events"}</span></summary>
          <ol className="mt-5 border-l border-[#dfe4eb] pl-5">
            {reservation.events.map((event) => {
              const item = formatReservationEvent(event);
              return <li key={event.id} className="relative pb-5 last:pb-0"><span aria-hidden="true" className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#2d67b2] ring-4 ring-white" /><p className="text-sm font-extrabold">{item.title}</p>{item.detail && <p className="mt-1 text-xs leading-5 text-[#657089]">{item.detail}</p>}<time className="mt-1 block text-xs text-[#748096]">{formatBusinessDateTime(event.created_at)}</time></li>;
            })}
          </ol>
        </details>
      </main>
    </div>
  );
}
