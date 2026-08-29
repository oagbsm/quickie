import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

type Customer = { id: string; auth_user_id: string | null; display_name: string | null; email: string | null; mobile: string | null; created_at: string };

export default async function Page() {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const [{ data: customerData, error: customerError }, { data: jobs }, { data: bookings }] = await Promise.all([
    admin.from("marketplace_customers").select("id,auth_user_id,display_name,email,mobile,created_at").order("created_at", { ascending: false }),
    admin.from("marketplace_jobs").select("id,customer_id,created_at"),
    admin.from("marketplace_bookings").select("customer_id,status,payment_status,amount_pence"),
  ]);
  if (customerError) throw new Error(`admin_marketplace_customers_failed:${customerError.code}`);
  const customers = (customerData || []) as Customer[];
  const jobRows = jobs || [];
  const bookingRows = bookings || [];
  const jobsFor = (id: string) => jobRows.filter((job) => job.customer_id === id);
  const spendFor = (id: string) => bookingRows.filter((booking) => booking.customer_id === id && booking.payment_status === "paid" && booking.status !== "cancelled").reduce((sum, booking) => sum + Number(booking.amount_pence || 0), 0);
  return <div className="mx-auto max-w-[1260px]"><header><h1 className="text-3xl font-black tracking-[-.04em]">Customers</h1><p className="mt-2 text-sm text-[#718099]">Marketplace customers and their posted jobs.</p></header><section className="mt-6 overflow-x-auto rounded-xl border border-[#e5eaf0] bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b bg-[#fafbfc] text-xs uppercase tracking-wide text-[#718099]"><tr><th className="p-4">Customer</th><th className="p-4">Jobs posted</th><th className="p-4">Joined</th><th className="p-4">Paid spend</th><th className="p-4">Status</th><th className="p-4 text-right">Open</th></tr></thead><tbody className="divide-y divide-[#edf0f4]">{customers.map((customer) => { const customerJobs = jobsFor(customer.id); const spend = spendFor(customer.id); return <tr key={customer.id} className="hover:bg-[#fbfcfd]"><td className="p-4"><Link href={`/admin/customers/${customer.id}`} className="font-black text-[#167d3c]">{customer.display_name || "Unnamed customer"}</Link><p className="mt-1 text-xs text-[#718099]">{customer.email || customer.mobile || (customer.auth_user_id ? "Authenticated user" : "No contact recorded")}</p></td><td className="p-4 font-black">{customerJobs.length}</td><td className="p-4 text-[#526078]">{new Date(customer.created_at).toLocaleDateString("en-GB")}</td><td className="p-4 font-black">{spend ? `£${(spend / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—"}</td><td className="p-4"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Active</span></td><td className="p-4 text-right"><Link href={`/admin/customers/${customer.id}`} className="font-black text-[#167d3c]">View →</Link></td></tr>; })}</tbody></table>{!customers.length && <p className="p-10 text-center text-[#657089]">No marketplace customers.</p>}</section><p className="mt-4 text-sm text-[#718099]">Showing {customers.length} unique marketplace customer{customers.length === 1 ? "" : "s"} · {jobRows.length} posted job{jobRows.length === 1 ? "" : "s"}</p></div>;
}
