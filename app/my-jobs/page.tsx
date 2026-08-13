import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MyJobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-jobs");
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  let { data: posted, error: postedError } = customer ? await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,budget_amount,status,created_at,marketplace_quotes(count)").eq("customer_id", customer.id).order("created_at", { ascending: false }) : { data: [], error: null };
  if (customer && postedError?.code === "42703" && /budget_amount/i.test(postedError.message)) {
    const fallback = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,status,created_at,marketplace_quotes(count)").eq("customer_id", customer.id).order("created_at", { ascending: false });
    posted = fallback.data?.map((job) => ({ ...job, budget_amount: null })) ?? null;
    postedError = fallback.error;
  }
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-black text-[#159548]">MY JOBS</p><h1 className="mt-2 text-4xl font-black">My jobs</h1></div><Link href="/#job-composer" className="rounded-xl bg-[#23a955] px-5 py-3 font-black text-[#061b3f]">Post a job</Link></div><div className="mt-6 grid gap-4">{posted?.map((job) => { const count = Array.isArray(job.marketplace_quotes) ? Number(job.marketplace_quotes[0]?.count || 0) : 0; const budget = job.budget_amount == null ? "Open budget" : `£${Number(job.budget_amount).toFixed(2).replace(/\.00$/, "")}`; return <Link key={job.id} href={`/jobs/${job.public_token}`} className="rounded-3xl border border-[#e7ebef] bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black capitalize">{(job.service_subtype || job.service).replaceAll("-", " ")}</h2><p className="mt-2 text-sm text-[#657089]">{job.postcode} · {job.status.replaceAll("_", " ")}</p></div><span className="rounded-full bg-[#eef8f1] px-3 py-1 text-sm font-black text-[#167d3c]">{count} offers</span></div><p className="mt-3 font-black text-[#167d3c]">Budget · {budget}</p><p className="mt-2 font-black text-[#167d3c]">{count ? `View ${count} offers` : "Waiting for offers"} →</p></Link>; })}{!posted?.length && <Empty text="You haven’t posted a job yet." />}</div></section></main>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-10 text-center text-[#657089]">{text}<Link href="/#job-composer" className="mt-3 block font-black text-[#167d3c]">Post a job →</Link></div>; }
