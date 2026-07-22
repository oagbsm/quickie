import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { joinServiceAreaWaitlist } from "../actions";
import ArchivePropertyForm from "./ArchivePropertyForm";
import { formatBusinessDateTime } from "@/lib/business/time";
import { activeBookingStatuses, isBookingStatus } from "@/lib/business/booking-status";
export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser(),
    { data } = await supabase
      .from("properties")
      .select(
        "id,nickname,address_line_1,city,postcode,property_type,bedrooms,bathrooms,is_airbnb_turnover,status,service_area_status,business_bookings(id,status,scheduled_start)",
      )
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Properties</h1>
          <p className="mt-1 text-[#657089]">
            Saved addresses and cleaning instructions.
          </p>
        </div>
        <Link
          href="/business/properties/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#079448] px-4 font-black text-white"
        >
          Add property
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.length ? (
          data.map((p) => {
            const bookings = (p.business_bookings || []).filter(
                (b) => isBookingStatus(b.status) && activeBookingStatuses.includes(b.status),
              ),
              next = bookings
                .filter((b) => new Date(b.scheduled_start) > new Date())
                .sort((a, b) =>
                  a.scheduled_start.localeCompare(b.scheduled_start),
                )[0],
              active = bookings.length > 0;
            return (
              <article
                key={p.id}
                className={`rounded-2xl border bg-white p-5 ${p.status === "archived" ? "opacity-65" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">{p.nickname}</h2>
                    <p className="mt-1 text-sm text-[#657089]">
                      {p.address_line_1}, {p.city}, {p.postcode}
                    </p>
                  </div>
                  <details className="relative">
                    <summary
                      aria-label="Property actions"
                      className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border text-xl"
                    >
                      •••
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border bg-white p-2 shadow-xl">
                      <ArchivePropertyForm
                        id={p.id}
                        archived={p.status === "archived"}
                        hasActiveBookings={active}
                      />
                    </div>
                  </details>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[#f1f3f6] px-3 py-1 capitalize">
                    {p.property_type.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full bg-[#f1f3f6] px-3 py-1">
                    {p.bedrooms ?? "—"} bed · {p.bathrooms ?? "—"} bath
                  </span>
                  {p.is_airbnb_turnover && (
                    <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-[#079448]">
                      Airbnb turnover
                    </span>
                  )}
                </div>
                <div
                  className={`mt-4 rounded-xl p-3 text-sm ${p.service_area_status === "eligible" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}
                >
                  <p className="font-black">
                    {p.service_area_status === "eligible"
                      ? "Slough service area"
                      : p.service_area_status === "waitlisted"
                        ? "Coverage requested"
                        : "Cleaning not yet available"}
                  </p>
                  {p.service_area_status === "outside_area" && (
                    <form action={joinServiceAreaWaitlist} className="mt-2">
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button className="font-black underline">
                        Join service-area waitlist
                      </button>
                    </form>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#788398]">
                    Next booking
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {next
                      ? formatBusinessDateTime(next.scheduled_start)
                      : "No upcoming booking"}
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/business/properties/${p.id}`}
                    className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-black"
                  >
                    View property
                  </Link>
                  {p.status === "active" &&
                    p.service_area_status === "eligible" && (
                      <Link
                        href={`/business/bookings/new?property=${p.id}`}
                        className="inline-flex min-h-11 items-center rounded-xl bg-[#edf7f1] px-4 text-sm font-black text-[#079448]"
                      >
                        Request a clean
                      </Link>
                    )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center md:col-span-2">
            <h2 className="text-xl font-black">No properties yet</h2>
            <p className="mt-2 text-[#657089]">
              Add your first property to request and manage cleaning.
            </p>
            <Link
              href="/business/properties/new"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#079448] px-5 font-black text-white"
            >
              Add property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
