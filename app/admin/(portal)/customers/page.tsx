import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: customers }, { data: jobs }, { data: offers }, { data: bookings }] = await Promise.all([
    admin.from("marketplace_customers").select("id,auth_user_id,display_name,email,mobile,created_at").order("created_at", { ascending: false }),
    admin.from("marketplace_jobs").select("customer_id"),
    admin.from("marketplace_quotes").select("provider_id"),
    admin.from("marketplace_bookings").select("customer_id,status"),
  ]);
  const providerIds = new Set((await admin.from("cleaner_profiles").select("user_id")).data?.map((profile) => profile.user_id));
  const needle = (query.q || "").trim().toLowerCase();
  const visible = (customers || []).filter((customer) => !needle || [customer.display_name, customer.email, customer.mobile].some((value) => String(value || "").toLowerCase().includes(needle)));
  const count = (items: Array<Record<string, string | null>>, key: string, value: string) => items.filter((item) => item[key] === value).length;
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Marketplace customers</h1><p className="mt-1 text-[#657089]">Customer accounts and their marketplace activity.</p></div><form><input name="q" defaultValue={query.q || ""} placeholder="Search name, email or phone" className="min-h-11 rounded-xl border px-4" /></form></div><div className="mt-6 overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b bg-[#f7f8fa] text-xs uppercase tracking-wide text-[#657089]"><tr><th className="p-4">Customer</th><th className="p-4">Contact</th><th className="p-4">Joined</th><th className="p-4">Jobs</th><th className="p-4">Offers made</th><th className="p-4">Accepted/completed</th><th className="p-4">Account</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id} className="border-b last:border-0"><td className="p-4"><p className="font-black">{customer.display_name || "Unnamed customer"}</p><p className="text-xs text-[#657089]">{customer.auth_user_id ? "Authenticated" : "Unlinked"}{providerIds.has(customer.auth_user_id || "") ? " · Provider profile" : ""}</p></td><td className="p-4">{customer.email || "No email"}<br /><span className="text-[#657089]">{customer.mobile || "No phone"}</span></td><td className="p-4">{new Date(customer.created_at).toLocaleDateString("en-GB")}</td><td className="p-4 font-black">{count(jobs || [], "customer_id", customer.id)}</td><td className="p-4 font-black">{customer.auth_user_id ? count(offers || [], "provider_id", customer.auth_user_id) : 0}</td><td className="p-4 font-black">{count((bookings || []).filter((booking) => ["booked", "completed", "in_progress", "en_route", "arrived"].includes(booking.status)), "customer_id", customer.id)}</td><td className="p-4">{customer.auth_user_id ? "Active" : "Guest"}</td></tr>)}</tbody></table>{!visible.length && <p className="p-8 text-center text-[#657089]">No marketplace customers found.</p>}</div></div>;
}
