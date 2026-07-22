import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { getBookingStatus } from "@/lib/business/booking-status";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatMoney } from "@/lib/business/pricing";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const q = await searchParams,
    { supabase, accountId } = await requireBusinessUser(),
    { data } = await supabase
      .from("business_bookings")
      .select(
        "id,service,scheduled_start,status,estimated_price_pence,estimated_price_max_pence,agreed_price_pence,pricing_mode,service_providers:assigned_provider_id(name),properties(nickname,postcode)",
      )
      .eq("account_id", accountId)
      .order("scheduled_start", { ascending: false });
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
          New booking
        </Link>
      </div>
      {q.created && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">
          <p className="font-black">Booking requested</p>
          <p className="mt-1 text-sm">
            Quickola will review the requested appointment. Open the booking to see the price and next step.
          </p>
        </div>
      )}
      <div className="mt-6 grid gap-3">
        {data?.length ? (
          data.map((b: any) => {
            const p = Array.isArray(b.properties)
                ? b.properties[0]
                : b.properties,
              provider = Array.isArray(b.service_providers)
                ? b.service_providers[0]
                : b.service_providers,
              status = getBookingStatus(b.status),
              price = b.agreed_price_pence ?? b.estimated_price_pence;
            return (
              <Link
                href={`/business/bookings/${b.id}`}
                key={b.id}
                className="grid gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#788398]">
                    Booking {b.id.slice(0, 8).toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {p?.nickname} · {b.service.replaceAll("_", " ")}
                  </h2>
                  <p className="mt-1 text-sm text-[#657089]">
                    {formatBusinessDateTime(b.scheduled_start)} · {p?.postcode}
                  </p>
                  {provider && <p className="mt-2 text-sm font-bold">Cleaning team: {provider.name}</p>}
                </div>
                <div className="sm:text-right">
                  <span className="inline-flex rounded-full bg-[#eef3f0] px-3 py-1 text-xs font-black text-[#075d35]">
                    {status.customerLabel}
                  </span>
                  <p className="mt-3 font-black">
                    {price == null
                      ? "Awaiting price"
                      : `${b.agreed_price_pence != null ? "Agreed" : "Estimated"}: ${formatMoney(price)}`}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-black">No bookings yet</h2>
            <p className="mt-2 text-[#657089]">
              Request cleaning for one of your properties.
            </p>
            <Link
              href="/business/bookings/new"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#079448] px-5 font-black text-white"
            >
              Request a clean
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
