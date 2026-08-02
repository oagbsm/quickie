import Link from "next/link";
import { listReservations } from "@/lib/server/reservations";
import { formatBusinessDateTime } from "@/lib/business/time";
import TurnoverStatus from "../components/TurnoverStatus";
import ReservationStatus from "./ReservationStatus";
import { reservationSourceLabel } from "@/lib/reservations/source";

const views = [
  ["Upcoming", "upcoming"],
  ["Past", "past"],
  ["Cancelled", "cancelled"],
] as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: requestedView } = await searchParams;
  const view = views.some(([, key]) => key === requestedView)
    ? (requestedView as "upcoming" | "past" | "cancelled")
    : "upcoming";
  const rows = await listReservations(view);
  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <h1 className="portal-title">Bookings</h1>
          <p className="portal-subtitle hidden sm:block">
            Manage guest stays and their linked cleans.
          </p>
        </div>
        <Link href="/business/reservations/new" className="portal-action">
          <span className="sm:hidden">+ Add</span>
          <span className="hidden sm:inline">Add booking</span>
        </Link>
      </header>
      <nav aria-label="Booking views" className="mt-5 grid grid-cols-3 border-b">
        {views.map(([label, key]) => (
          <Link
            key={key}
            href={`/business/reservations?view=${key}`}
            aria-current={view === key ? "page" : undefined}
            className={`min-h-12 border-b-2 px-2 text-center text-sm font-extrabold leading-[46px] ${
              view === key
                ? "border-[#16467e] text-[#16467e]"
                : "border-transparent text-[#657089]"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="portal-panel mt-4">
        {rows.length ? (
          <div className="divide-y divide-[#e7ebf0]">
            <div className="hidden grid-cols-[minmax(170px,1fr)_160px_160px_132px_150px_100px_20px] gap-4 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid">
              <span>Property</span>
              <span>Check-in</span>
              <span>Check-out</span>
              <span>Booking</span>
              <span>Linked clean</span>
              <span>Source</span>
              <span />
            </div>
            {rows.map((row) => (
              <Link
                href={`/business/reservations/${row.id}`}
                key={row.id}
                className="portal-list-row grid gap-3 p-4 outline-none lg:grid-cols-[minmax(170px,1fr)_160px_160px_132px_150px_100px_20px] lg:items-center lg:gap-4 lg:px-5 lg:py-5"
              >
                <div>
                  <p className="font-extrabold">{row.property.nickname}</p>
                  <p className="mt-0.5 text-xs text-[#657089]">
                    {row.property.postcode}
                    {row.guest_name ? ` · ${row.guest_name}` : ""}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="portal-label lg:hidden">Check-in</span>
                  <p className="mt-1 font-bold lg:mt-0">
                    {formatBusinessDateTime(row.check_in_at, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="hidden text-sm lg:block">
                  <p className="font-bold">
                    {formatBusinessDateTime(row.check_out_at, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ReservationStatus status={row.status} />
                <div>
                  {row.turnover ? (
                    <>
                      <p className="text-sm font-extrabold">
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                        }).format(new Date(`${row.turnover.turnover_date}T12:00:00Z`))}
                      </p>
                      <div className="mt-1">
                        <TurnoverStatus status={row.turnover.status} />
                      </div>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-red-700">Unavailable</span>
                  )}
                </div>
                <div className="text-sm font-bold capitalize text-[#657089]">
                  <span className="inline-flex rounded-full bg-[#eef4fb] px-2.5 py-1 text-xs font-extrabold text-[#245b9d]">
                    {reservationSourceLabel(row.source, row.sourceConnection)}
                  </span>
                  <p className="mt-1 text-[11px] font-normal">
                    Updated {formatBusinessDateTime(row.updated_at, { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span aria-hidden="true" className="hidden text-xl lg:block">
                  ›
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-lg font-extrabold">
              {view === "upcoming" ? "No upcoming bookings" : `No ${view} bookings`}
            </h2>
            <p className="mt-2 text-sm text-[#657089]">
              {view === "upcoming"
                ? "Add a manual booking to schedule its clean."
                : "Bookings in this view will appear here."}
            </p>
            {view === "upcoming" && (
              <Link href="/business/reservations/new" className="portal-action mt-5">
                Add booking
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
