import Form from "next/form";
import Link from "next/link";
import { BookingStatusBadge } from "@/app/business/components/BookingPresentation";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  BOOKING_STATUSES,
  activeBookingStatuses,
  canShowAssignedProvider,
  formatServiceLabel,
  getBookingStatus,
  getPricePresentation,
  isBookingStatus,
} from "@/lib/business/booking-status";
import {
  compareBookingDateAscending,
  compareBookingDateDescending,
  formatPropertyName,
  getLondonDateKey,
} from "@/lib/business/portal-display";
import { formatMoney } from "@/lib/business/pricing";
import { formatBusinessDateTime } from "@/lib/business/time";

type BookingRow = {
  id: string;
  service: string;
  scheduled_start: string;
  status: string;
  estimated_price_pence: number | null;
  estimated_price_max_pence: number | null;
  agreed_price_pence: number | null;
  pricing_mode: string | null;
  service_providers: { name: string } | { name: string }[] | null;
  properties:
    | { id: string; nickname: string; postcode: string }
    | { id: string; nickname: string; postcode: string }[]
    | null;
};

type SearchParams = {
  created?: string;
  view?: string;
  property?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const bookingViews = ["all", "upcoming", "completed", "action-required"] as const;
type BookingView = (typeof bookingViews)[number];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const q = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  const { data } = await supabase
    .from("business_bookings")
    .select(
      "id,service,scheduled_start,status,estimated_price_pence,estimated_price_max_pence,agreed_price_pence,pricing_mode,service_providers:assigned_provider_id(name),properties(id,nickname,postcode)",
    )
    .eq("account_id", accountId);

  const rows = (data || []) as BookingRow[];
  const view: BookingView = bookingViews.includes(q.view as BookingView)
    ? (q.view as BookingView)
    : "all";
  const now = new Date();
  const selectedStatus =
    q.status && isBookingStatus(q.status) ? q.status : "";
  const selectedProperty = q.property || "";
  const from = q.from && datePattern.test(q.from) ? q.from : "";
  const to = q.to && datePattern.test(q.to) ? q.to : "";
  const sort = q.sort === "oldest" ? "oldest" : "newest";
  const properties = Array.from(
    new Map(
      rows.flatMap((booking) => {
        const property = getRelation(booking.properties);
        return property ? [[property.id, property] as const] : [];
      }),
    ).values(),
  ).sort((a, b) =>
    formatPropertyName(a.nickname).localeCompare(formatPropertyName(b.nickname)),
  );
  const bookings = rows
    .filter((booking) => {
      const property = getRelation(booking.properties);
      const date = getLondonDateKey(booking.scheduled_start);
      return (
        (view === "all" ||
          (view === "upcoming" &&
            new Date(booking.scheduled_start) >= now &&
            activeBookingStatuses.includes(booking.status as never)) ||
          (view === "completed" && booking.status === "completed") ||
          (view === "action-required" &&
            booking.status === "awaiting_customer_confirmation")) &&
        (!selectedProperty || property?.id === selectedProperty) &&
        (!selectedStatus || booking.status === selectedStatus) &&
        (!from || date >= from) &&
        (!to || date <= to)
      );
    })
    .sort(
      sort === "oldest"
        ? compareBookingDateAscending
        : compareBookingDateDescending,
    );
  const filtersActive = Boolean(
    selectedProperty || selectedStatus || from || to || q.sort === "oldest",
  );
  const viewLabel = {
    all: "All",
    upcoming: "Upcoming",
    completed: "Completed",
    "action-required": "Action required",
  }[view];
  const viewHref =
    view === "all" ? "/business/bookings" : `/business/bookings?view=${view}`;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Bookings</h1>
          <p className="mt-1 text-[#657089]">
            Your upcoming and previous property cleans.
          </p>
        </div>
        <Link
          href="/business/bookings/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#079448] px-4 font-black text-white"
        >
          Request a clean
        </Link>
      </div>
      {q.created && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">
          <p className="font-black">Booking received</p>
          <p className="mt-1 text-sm">
            We’ve received your booking. Open it to see the current status and
            next step.
          </p>
        </div>
      )}

      <nav
        aria-label="Filter bookings by view"
        className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-[#dfe5e9] bg-white p-1.5"
      >
        {bookingViews.map((item) => {
          const label = {
            all: "All",
            upcoming: "Upcoming",
            completed: "Completed",
            "action-required": "Action required",
          }[item];
          const active = view === item;
          return (
            <Link
              key={item}
              href={
                item === "all"
                  ? "/business/bookings"
                  : `/business/bookings?view=${item}`
              }
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-extrabold outline-none transition focus-visible:ring-4 focus-visible:ring-[#2e68bb]/30 active:scale-[.98] ${
                active
                  ? "bg-[#071f49] text-white"
                  : "text-[#526078] hover:bg-[#eef2f7] hover:text-[#071f49]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <Form
        action="/business/bookings"
        className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_1fr_1fr_auto]"
      >
        {view !== "all" && <input type="hidden" name="view" value={view} />}
        <FilterField label="Property">
          <select
            name="property"
            defaultValue={selectedProperty}
            className={fieldClassName}
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {formatPropertyName(property.nickname)}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select
            name="status"
            defaultValue={selectedStatus}
            className={fieldClassName}
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getBookingStatus(status).customerLabel}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            name="from"
            type="date"
            defaultValue={from}
            className={fieldClassName}
          />
        </FilterField>
        <FilterField label="To">
          <input
            name="to"
            type="date"
            defaultValue={to}
            className={fieldClassName}
          />
        </FilterField>
        <FilterField label="Order">
          <select name="sort" defaultValue={sort} className={fieldClassName}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </FilterField>
        <div className="flex items-end gap-3">
          <button className="inline-flex min-h-11 items-center rounded-xl bg-[#071f49] px-4 text-sm font-black text-white">
            Apply
          </button>
          {filtersActive && (
            <Link
              href={viewHref}
              className="inline-flex min-h-11 items-center text-sm font-bold text-[#526078] underline"
            >
              Reset
            </Link>
          )}
        </div>
      </Form>

      <p className="mt-4 text-sm font-semibold text-[#657089]">
        {viewLabel}: {bookings.length}{" "}
        {bookings.length === 1 ? "booking" : "bookings"}
      </p>
      <div className="mt-3 grid gap-3">
        {bookings.length ? (
          bookings.map((booking) => {
            const property = getRelation(booking.properties);
            const provider = getRelation(booking.service_providers);
            const price = getPricePresentation(booking);
            return (
              <Link
                href={`/business/bookings/${booking.id}`}
                key={booking.id}
                className="grid gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#788398]">
                    Booking {booking.id.slice(0, 8).toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {formatPropertyName(property?.nickname)} ·{" "}
                    {formatServiceLabel(booking.service)}
                  </h2>
                  <p className="mt-1 text-sm text-[#657089]">
                    {formatBusinessDateTime(booking.scheduled_start)}
                    {property?.postcode ? ` · ${property.postcode}` : ""}
                  </p>
                  {provider && canShowAssignedProvider(booking.status) && (
                    <p className="mt-2 text-sm font-bold">
                      Cleaning team: {provider.name}
                    </p>
                  )}
                </div>
                <div className="sm:text-right">
                  <BookingStatusBadge status={booking.status} />
                  <p className="mt-3 font-black">
                    {price.amountPence == null
                      ? price.label
                      : `${price.label}: ${formatMoney(price.amountPence)}`}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-black">
              {filtersActive
                ? "No matching bookings"
                : view === "upcoming"
                  ? "No upcoming bookings"
                  : view === "completed"
                    ? "No completed bookings"
                    : view === "action-required"
                      ? "You’re all caught up"
                      : "No bookings yet"}
            </h2>
            <p className="mt-2 text-[#657089]">
              {filtersActive
                ? "Try changing or resetting the filters."
                : view === "upcoming"
                  ? "Your schedule is clear. Request a clean whenever you’re ready."
                  : view === "completed"
                    ? "Completed cleans will appear here with their recorded details."
                    : view === "action-required"
                      ? "There are no bookings waiting for your approval."
                : "Request cleaning for one of your properties."}
            </p>
              {filtersActive ? (
              <Link
                href={viewHref}
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border px-5 font-black"
              >
                Reset filters
              </Link>
            ) : view === "action-required" ? (
              <Link
                href="/business/bookings?view=upcoming"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#071f49] px-5 font-black text-white"
              >
                View upcoming bookings
              </Link>
            ) : view === "completed" ? (
              <Link
                href="/business/bookings"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border px-5 font-black"
              >
                View all bookings
              </Link>
            ) : (
              <Link
                href="/business/bookings/new"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#079448] px-5 font-black text-white"
              >
                Request a clean
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const fieldClassName =
  "mt-1 min-h-11 w-full rounded-xl border border-[#d9dee8] bg-white px-3 text-sm font-semibold text-[#071638]";

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-bold text-[#526078]">
      {label}
      {children}
    </label>
  );
}

function getRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}
