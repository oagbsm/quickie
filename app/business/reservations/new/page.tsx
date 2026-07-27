import { randomUUID } from "node:crypto";
import Link from "next/link";
import { listReservationProperties } from "@/lib/server/reservations";
import ReservationForm from "../ReservationForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property: requestedProperty } = await searchParams;
  const properties = await listReservationProperties();
  const selected =
    properties.find((property) => property.id === requestedProperty) || properties[0];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/business/reservations" className="text-sm font-bold text-[#526078]">
        ← Reservations
      </Link>
      <header className="mb-7 mt-4">
        <p className="text-sm font-extrabold text-[#2d67b2]">MANUAL RESERVATION</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
          Add reservation
        </h1>
        <p className="mt-2 text-[#657089]">
          The cleaning turnover will be created automatically from check-out.
        </p>
      </header>
      {properties.length ? (
        <ReservationForm
          mode="create"
          requestKey={randomUUID()}
          properties={properties}
          initial={{
            propertyId: selected?.id || "",
            guestName: "",
            guestCount: "",
            checkInDate: "",
            checkInTime: selected?.default_checkin_time.slice(0, 5) || "15:00",
            checkOutDate: "",
            checkOutTime: selected?.default_checkout_time.slice(0, 5) || "11:00",
          }}
        />
      ) : (
        <section className="portal-card p-8 text-center">
          <h2 className="text-xl font-extrabold">Add an active property first</h2>
          <p className="mt-2 text-sm text-[#657089]">
            Every reservation must belong to a property in this business.
          </p>
          <Link href="/business/properties/new" className="portal-action mt-5">
            Add property
          </Link>
        </section>
      )}
    </div>
  );
}
