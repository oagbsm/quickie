import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import StatusBadge from "../../components/StatusBadge";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatMoney } from "@/lib/business/pricing";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const q = await searchParams,
    { supabase } = await requireAdmin();
  let query = supabase
    .from("business_bookings")
    .select(
      "id,status,service,scheduled_start,estimated_price_pence,agreed_price_pence,requires_manual_review,assigned_provider_id,properties(nickname,postcode,service_area_status),business_accounts(name),service_providers:assigned_provider_id(name)",
    )
    .order("scheduled_start");
  if (q.status) query = query.eq("status", q.status);
  const { data } = await query;
  const search = (q.q || "").toLowerCase(),
    rows = (data || []).filter((b: any) => {
      if (!search) return true;
      const p = Array.isArray(b.properties) ? b.properties[0] : b.properties,
        a = Array.isArray(b.business_accounts)
          ? b.business_accounts[0]
          : b.business_accounts,
        provider = Array.isArray(b.service_providers)
          ? b.service_providers[0]
          : b.service_providers;
      return [b.id, p?.nickname, p?.postcode, a?.name, provider?.name].some(
        (x) =>
          String(x || "")
            .toLowerCase()
            .includes(search),
      );
    });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Bookings</h1>
          <p className="mt-1 text-[#657089]">
            Review, price and assign business bookings.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q.q}
            placeholder="Reference, customer, postcode…"
            className="min-h-11 rounded-xl border px-4"
          />
          <button className="rounded-xl bg-[#071638] px-4 font-black text-white">
            Search
          </button>
        </form>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto">
        {[
          ["", "All"],
          ["requested", "Requested"],
          ["under_review", "Under review"],
          ["confirmed", "Unassigned"],
          ["assigned", "Assigned"],
          ["in_progress", "In progress"],
          ["completed", "Completed"],
        ].map(([v, l]) => (
          <Link
            key={v}
            href={v ? `/admin/bookings?status=${v}` : "/admin/bookings"}
            className="whitespace-nowrap rounded-full border bg-white px-3 py-2 text-sm font-bold"
          >
            {l}
          </Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#f7f9fa] text-[#657089]">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Customer / property</th>
              <th className="p-4">Service</th>
              <th className="p-4">Price</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b: any) => {
              const p = Array.isArray(b.properties)
                  ? b.properties[0]
                  : b.properties,
                a = Array.isArray(b.business_accounts)
                  ? b.business_accounts[0]
                  : b.business_accounts,
                provider = Array.isArray(b.service_providers)
                  ? b.service_providers[0]
                  : b.service_providers,
                price = b.agreed_price_pence ?? b.estimated_price_pence;
              return (
                <tr key={b.id} className="border-t hover:bg-[#fafcfb]">
                  <td className="p-4 font-bold">
                    {formatBusinessDateTime(b.scheduled_start)}
                  </td>
                  <td className="p-4">
                    <p className="font-black">{a?.name}</p>
                    <p className="text-[#657089]">
                      {p?.nickname} · {p?.postcode}
                    </p>
                  </td>
                  <td className="p-4">
                    {b.service.replaceAll("_", " ")}
                    {b.requires_manual_review && (
                      <span className="ml-2 text-xs font-black text-amber-800">
                        Review
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-black">
                    {price == null ? "Awaiting price" : formatMoney(price)}
                  </td>
                  <td className="p-4">{provider?.name || "Being arranged"}</td>
                  <td className="p-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-black text-[#079448]"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-10 text-center text-[#657089]">
            No bookings match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
