import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setMarketplaceProviderQualification } from "@/app/admin/actions";

export default async function ProviderQualificationPage() {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin.from("marketplace_provider_services").select("provider_id,category_slug,job_type_slug,qualification_verified,cleaner_profiles(display_name,business_name)").in("category_slug", ["plumbing", "electrical", "smart-home"]).order("category_slug");
  return <main className="mx-auto max-w-4xl p-8"><h1 className="text-3xl font-black">Provider qualification checks</h1><p className="mt-2 text-[#657089]">Mark regulated service selections as verified only after the existing offline check is complete.</p><div className="mt-6 grid gap-3">{(rows || []).map((row) => { const profile = row.cleaner_profiles as { display_name?: string | null; business_name?: string | null } | null; return <article key={`${row.provider_id}-${row.category_slug}-${row.job_type_slug}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-4"><div><p className="font-black">{profile?.business_name || profile?.display_name || row.provider_id}</p><p className="text-sm text-[#657089]">{row.category_slug} · {row.job_type_slug}</p></div><form action={setMarketplaceProviderQualification}><input type="hidden" name="providerId" value={row.provider_id} /><input type="hidden" name="categorySlug" value={row.category_slug} /><input type="hidden" name="jobTypeSlug" value={row.job_type_slug} /><input type="hidden" name="verified" value={row.qualification_verified ? "0" : "1"} /><button className="rounded-xl bg-[#061b3f] px-4 py-2 text-sm font-black text-white">{row.qualification_verified ? "Remove verification" : "Mark verified"}</button></form></article>; })}</div></main>;
}
