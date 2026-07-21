import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import BookingRequestForm from "./BookingRequestForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; error?: string }>;
}) {
  const q = await searchParams,
    { supabase, accountId } = await requireBusinessUser(),
    { data } = await supabase
      .from("properties")
      .select(
        "id,nickname,address_line_1,postcode,property_type,bedrooms,bathrooms,service_area_status",
      )
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("nickname"),
    properties = data || [];
  return (
    <div>
      <Link
        href="/business/bookings"
        className="text-sm font-black text-[#657089]"
      >
        ← Bookings
      </Link>
      <h1 className="mt-4 text-3xl font-black">Book a clean</h1>
      <p className="mt-2 mb-6 text-[#657089]">
        See your estimated price before confirming. Managed cleaning is
        currently available in Slough.
      </p>
      {properties.length ? (
        <BookingRequestForm
          properties={properties}
          selected={q.property}
          error={q.error}
        />
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
          <h2 className="text-xl font-black">No properties yet</h2>
          <p className="mt-2 text-[#657089]">
            Add your first property to book and manage cleaning.
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
  );
}
