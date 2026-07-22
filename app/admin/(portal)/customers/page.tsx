import { requireAdmin } from "@/lib/admin/auth";
import Link from "next/link";
export default async function Page() {
  const { supabase } = await requireAdmin(),
    { data } = await supabase
      .from("business_accounts")
      .select(
        "id,name,customer_type,phone,status,created_at,business_members(full_name)",
      )
      .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-black">Customers</h1>
      <p className="mt-1 text-[#657089]">
        Business accounts using the property portal.
      </p>
      <div className="mt-6 grid gap-3">
        {data?.length ? (
          data.map((a: any) => (
            <Link href={`/admin/customers/${a.id}`}
              key={a.id}
              className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <h2 className="font-black">{a.name}</h2>
                <p className="text-sm text-[#657089]">
                  {a.customer_type.replaceAll("_", " ")} ·{" "}
                  {a.phone || "No phone"}
                </p>
              </div>
              <span className="rounded-full bg-[#f1f3f6] px-3 py-1 text-xs font-black">
                {a.status}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-[#657089]">
            No customer accounts yet.
          </p>
        )}
      </div>
    </div>
  );
}
