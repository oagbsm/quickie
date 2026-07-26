import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import TurnoverForm from "../TurnoverForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property: requestedProperty } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  const [{ data: properties }, { data: workers }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id,nickname,default_checkout_time,default_checkin_time,estimated_turnover_minutes,linen_requirements,property_workers(worker_id,is_default)",
      )
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("nickname"),
    supabase
      .from("workers")
      .select("id,display_name,company_name")
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("display_name"),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/business/turnovers"
        className="text-sm font-bold text-[#526078]"
      >
        ← Turnovers
      </Link>
      <div className="mb-7 mt-4">
        <p className="text-sm font-extrabold text-[#2d67b2]">MANUAL TURNOVER</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
          Add guest arrival
        </h1>
        <p className="mt-2 text-[#657089]">
          Set the arrival window, apply the property standard and invite your
          cleaner to confirm the readiness work.
        </p>
      </div>
      {properties?.length ? (
        <TurnoverForm
          properties={properties.map((property) => ({
            ...property,
            default_worker_id:
              property.property_workers?.find((row) => row.is_default)
                ?.worker_id || null,
          }))}
          workers={workers || []}
          initialPropertyId={requestedProperty}
        />
      ) : (
        <div className="rounded-xl border bg-white p-8">
          <h2 className="text-xl font-extrabold">Add your first property</h2>
          <p className="mt-2 text-[#657089]">
            A turnover needs a property and its guest-ready standard.
          </p>
          <Link
            href="/business/properties/new"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white"
          >
            Add property
          </Link>
        </div>
      )}
    </div>
  );
}
