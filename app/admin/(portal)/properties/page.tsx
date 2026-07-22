import { requireAdmin } from "@/lib/admin/auth";
import Link from "next/link";
export default async function Page() {
  const { supabase } = await requireAdmin(),
    { data } = await supabase
      .from("properties")
      .select(
        "id,nickname,address_line_1,city,postcode,property_type,bedrooms,bathrooms,service_area_status,status,business_accounts(name)",
      )
      .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-black">Properties</h1>
      <p className="mt-1 text-[#657089]">
        Customer properties and service-area eligibility.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f7f9fa]">
            <tr>
              <th className="p-4">Property</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Type</th>
              <th className="p-4">Layout</th>
              <th className="p-4">Coverage</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p: any) => {
              const a = Array.isArray(p.business_accounts)
                ? p.business_accounts[0]
                : p.business_accounts;
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-4">
                    <Link href={`/admin/properties/${p.id}`} className="font-black underline">{p.nickname}</Link>
                    <p className="text-[#657089]">
                      {p.address_line_1}, {p.city}, {p.postcode}
                    </p>
                  </td>
                  <td className="p-4">{a?.name}</td>
                  <td className="p-4">
                    {p.property_type.replaceAll("_", " ")}
                  </td>
                  <td className="p-4">
                    {p.bedrooms ?? "—"} bed · {p.bathrooms ?? "—"} bath
                  </td>
                  <td className="p-4 font-bold">
                    {p.service_area_status.replaceAll("_", " ")}
                  </td>
                  <td className="p-4">{p.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
