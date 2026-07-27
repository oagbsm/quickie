import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getReservationDetail,
  listReservationProperties,
} from "@/lib/server/reservations";
import { londonFormDateTime } from "@/lib/business/time";
import ReservationForm from "../../ReservationForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [reservation, properties] = await Promise.all([
    getReservationDetail(id),
    listReservationProperties(),
  ]);
  if (!reservation) notFound();
  if (reservation.source !== "manual")
    redirect(
      `/business/reservations/${id}?error=${encodeURIComponent("Booking dates are managed by the connected calendar.")}`,
    );
  if (reservation.status === "cancelled")
    redirect(
      `/business/reservations/${id}?error=${encodeURIComponent("A cancelled reservation cannot be edited.")}`,
    );
  const checkIn = londonFormDateTime(reservation.check_in_at);
  const checkOut = londonFormDateTime(reservation.check_out_at);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/business/reservations/${id}`} className="text-sm font-bold text-[#526078]">
        ← Reservation
      </Link>
      <header className="mb-7 mt-4">
        <p className="text-sm font-extrabold text-[#2d67b2]">MANUAL RESERVATION</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
          Edit reservation
        </h1>
        <p className="mt-2 text-[#657089]">
          Schedule changes update the existing linked turnover; its ID is preserved.
        </p>
      </header>
      <ReservationForm
        mode="edit"
        reservationId={id}
        properties={properties}
        initial={{
          propertyId: reservation.property_id,
          guestName: reservation.guest_name || "",
          guestCount: reservation.guest_count?.toString() || "",
          checkInDate: checkIn.date,
          checkInTime: checkIn.time,
          checkOutDate: checkOut.date,
          checkOutTime: checkOut.time,
        }}
      />
    </div>
  );
}
