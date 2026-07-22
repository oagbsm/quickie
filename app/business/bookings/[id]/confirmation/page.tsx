import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatMoney, formatDuration } from "@/lib/business/pricing";
import { formatBusinessDateTime } from "@/lib/business/time";
import { getBookingStatus } from "@/lib/business/booking-status";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, accountId } = await requireBusinessUser();
  const { data: booking } = await supabase
    .from("business_bookings")
    .select(
      "id,service,recurrence,scheduled_start,duration_minutes,status,estimated_price_pence,estimated_price_max_pence,pricing_mode,payment_status,properties(nickname,address_line_1,postcode)",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!booking) notFound();
  const property = Array.isArray(booking.properties)
    ? booking.properties[0]
    : booking.properties;
  const manual = booking.pricing_mode === "manual_review";
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <div
          className="grid h-12 w-12 place-items-center rounded-full bg-[#eaf7ef] text-2xl font-black text-[#08783f]"
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[.14em] text-[#08783f]">
          Booking received
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Your cleaning request has been submitted.
        </h1>
        <p className="mt-4 leading-7 text-[#657089]">
          Quickola will review the appointment details and confirm the next step. This
          request is not yet a confirmed appointment.
        </p>
        <dl className="mt-8 grid gap-4 rounded-2xl bg-[#f4f6f9] p-5 sm:grid-cols-2">
          <Item
            label="Reference"
            value={`QK-${booking.id.slice(0, 8).toUpperCase()}`}
          />
          <Item
            label="Status"
            value={getBookingStatus(booking.status).customerLabel}
          />
          <Item
            label="Property"
            value={`${property?.nickname || "Property"}, ${property?.postcode || ""}`}
          />
          <Item label="Service" value={booking.service.replaceAll("_", " ")} />
          <Item
            label="Requested start"
            value={formatBusinessDateTime(booking.scheduled_start)}
          />
          <Item
            label="Frequency"
            value={booking.recurrence.replaceAll("_", " ")}
          />
          <Item
            label="Estimated duration"
            value={formatDuration(booking.duration_minutes || 0)}
          />
          <Item
            label={manual ? "Estimated range" : "Estimated price"}
            value={
              manual
                ? `${formatMoney(booking.estimated_price_pence)}–${formatMoney(booking.estimated_price_max_pence || booking.estimated_price_pence)}`
                : formatMoney(booking.estimated_price_pence)
            }
          />
          <Item
            label="Payment"
            value="No payment is due until the booking is confirmed."
          />
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/business/bookings/${booking.id}`}
            className="rounded-xl bg-[#079448] px-5 py-3 text-center font-black text-white"
          >
            View booking
          </Link>
          <Link
            href="/business/dashboard"
            className="rounded-xl border px-5 py-3 text-center font-black"
          >
            Return to dashboard
          </Link>
          <Link
            href="/business/bookings/new"
            className="px-5 py-3 text-center font-black text-[#08783f]"
          >
            Request another clean
          </Link>
        </div>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-[#778198]">
        {label}
      </dt>
      <dd className="mt-1 font-extrabold capitalize">{value}</dd>
    </div>
  );
}
