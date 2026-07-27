import Link from "next/link";
import { notFound } from "next/navigation";
import { getReservationDetail } from "@/lib/server/reservations";
import { formatBusinessDateTime } from "@/lib/business/time";
import {
  formatReservationEvent,
  isSameLondonDate,
} from "@/lib/reservations/presentation";
import TurnoverStatus from "../../components/TurnoverStatus";
import ReservationStatus from "../ReservationStatus";
import CancelReservation from "../CancelReservation";

const detail = (label: string, value: React.ReactNode) => (
  <div>
    <dt className="portal-label">{label}</dt>
    <dd className="mt-1 font-bold">{value || "Not provided"}</dd>
  </div>
);

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
  const sameDay = turnover
    ? isSameLondonDate(turnover.guest_checkout_at, turnover.next_checkin_at)
    : false;
  const success = message.created
    ? "Reservation created with one linked turnover."
    : message.updated
      ? "Reservation and linked turnover updated."
      : message.unchanged
        ? "No reservation changes were needed."
        : message.cancelled
          ? "Reservation and linked turnover cancelled."
          : null;
  return (
    <div className="portal-page max-w-6xl">
      <Link href="/business/reservations" className="text-sm font-bold text-[#526078]">
        ← Reservations
      </Link>
      <header className="mt-4 flex flex-col gap-4 border-b border-[#dfe4eb] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase text-[#2d67b2]">
            {reservation.source.replaceAll("_", " ")} reservation
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em]">
            {reservation.property.nickname}
          </h1>
          <p className="mt-2 text-[#657089]">
            {reservation.guest_name || "Guest name not provided"}
            {reservation.guest_count ? ` · ${reservation.guest_count} guests` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReservationStatus status={reservation.status} />
          {reservation.status !== "cancelled" && (
            <>
              <Link
                href={`/business/reservations/${id}/edit`}
                className="portal-action-secondary"
              >
                Edit reservation
              </Link>
              <CancelReservation
                reservationId={id}
                propertyName={reservation.property.nickname}
              />
            </>
          )}
        </div>
      </header>
      {success && (
        <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-800">
          {success}
        </p>
      )}
      {message.error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 font-bold text-red-800">
          {message.error}
        </p>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="grid content-start gap-6">
          <section className="portal-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Reservation</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {detail("Property", reservation.property.nickname)}
              {detail("Source", reservation.source === "manual" ? "Manual" : reservation.source)}
              {detail("Guest name", reservation.guest_name)}
              {detail("Guest count", reservation.guest_count)}
              {detail("Check-in", formatBusinessDateTime(reservation.check_in_at))}
              {detail("Check-out", formatBusinessDateTime(reservation.check_out_at))}
              {detail("Created", formatBusinessDateTime(reservation.created_at))}
              {detail("Last updated", formatBusinessDateTime(reservation.updated_at))}
            </dl>
          </section>
          <section className="portal-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Linked turnover</h2>
                <p className="mt-1 text-sm text-[#657089]">
                  One turnover kept in sync with this reservation.
                </p>
              </div>
              {turnover && <TurnoverStatus status={turnover.status} />}
            </div>
            {turnover ? (
              <>
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  {detail(
                    "Turnover date",
                    new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
                      new Date(`${turnover.turnover_date}T12:00:00Z`),
                    ),
                  )}
                  {detail(
                    turnover.next_checkin_at ? "Cleaning window" : "Standard cleaning window",
                    `${formatBusinessDateTime(turnover.access_start_at, { hour: "2-digit", minute: "2-digit" })}–${formatBusinessDateTime(turnover.window_end_at, { hour: "2-digit", minute: "2-digit" })}`,
                  )}
                  {detail(
                    "Next check-in",
                    turnover.next_checkin_at
                      ? formatBusinessDateTime(turnover.next_checkin_at)
                      : "No later confirmed reservation",
                  )}
                  {detail("Created from", "Manual reservation")}
                </dl>
                {(sameDay || turnover.requires_attention) && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {sameDay && (
                      <span className="portal-pill border border-violet-100 bg-violet-50 text-violet-800">
                        Same-day turnover
                      </span>
                    )}
                    {turnover.requires_attention && (
                      <span className="portal-pill border border-amber-100 bg-amber-50 text-amber-900">
                        Timing needs attention
                      </span>
                    )}
                  </div>
                )}
                <Link
                  href={`/business/turnovers/${turnover.id}`}
                  className="portal-action-secondary mt-5"
                >
                  View turnover
                </Link>
              </>
            ) : (
              <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800">
                The linked turnover is unavailable. No reservation data has been removed.
              </p>
            )}
          </section>
        </div>
        <aside className="portal-card h-fit p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Audit history</h2>
          <ol className="mt-5 border-l border-[#dfe4eb] pl-5">
            {reservation.events.map((event) => {
              const item = formatReservationEvent(event);
              return (
                <li key={event.id} className="relative pb-5 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#2d67b2] ring-4 ring-white"
                  />
                  <p className="text-sm font-extrabold">{item.title}</p>
                  {item.detail && (
                    <p className="mt-1 text-xs leading-5 text-[#657089]">{item.detail}</p>
                  )}
                  <time className="mt-1 block text-xs text-[#748096]">
                    {formatBusinessDateTime(event.created_at)}
                  </time>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
