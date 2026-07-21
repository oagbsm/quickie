import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveBusinessWorkspace } from "@/lib/business/workspace";
import PropertyForm from "../components/PropertyForm";
import { acceptTerms } from "../actions";

export default async function Page({searchParams}:{searchParams:Promise<{step?:string}>}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");
  const workspace = await resolveBusinessWorkspace();
  if (!workspace.ok) redirect(`/business/setup-error?ref=${encodeURIComponent(workspace.reference)}`);
  const [{count},{data:terms}] = await Promise.all([
    supabase.from("properties").select("id",{count:"exact",head:true}).eq("account_id",workspace.accountId),
    supabase.from("terms_acceptances").select("id").eq("account_id",workspace.accountId).eq("terms_version","business-draft-2026-07").maybeSingle(),
  ]);
  if ((count||0)>0 && terms) redirect("/business/dashboard");
  const {step:requestedStep}=await searchParams;
  const step=requestedStep||(!(count||0)?"property":"setup");
  return <main className="min-h-screen bg-[#f3f6f8] px-5 py-10"><div className="mx-auto max-w-3xl"><div className="mb-7 flex gap-2" aria-label="Onboarding progress">{[1,2,3,4].map(n=><span key={n} className={`h-2 flex-1 rounded-full ${n<=(step==="property"?3:4)?"bg-[#079448]":"bg-[#dce2e9]"}`}/>)}</div><p className="text-sm font-black text-[#079448]">{step==="property"?"STEP 3 OF 4":"STEP 4 OF 4"}</p>{step==="property"?<><h1 className="mt-2 mb-2 text-3xl font-black">Add your first property</h1><p className="mb-6 text-[#657089]">You can add more properties at any time.</p><PropertyForm/></>:<div className="rounded-3xl bg-white p-7 shadow-sm"><h1 className="text-3xl font-black">Review and accept</h1><p className="mt-3 text-[#657089]">Choose one-off or recurring cleaning each time you make a request. No booking is required now.</p><form action={acceptTerms} className="mt-8 border-t pt-6"><input type="hidden" name="termsVersion" value="business-draft-2026-07"/><label className="flex items-start gap-3 font-bold"><input type="checkbox" required className="mt-1 h-5 w-5"/><span>I accept the <Link className="text-[#079448] underline" href="/business/legal/terms" target="_blank">draft Quickola Business Terms</Link>, <Link className="text-[#079448] underline" href="/privacy-policy" target="_blank">Privacy Policy</Link>, and service and cancellation terms.</span></label><button className="mt-6 w-full rounded-xl bg-[#079448] p-3.5 font-black text-white">Enter dashboard</button></form></div>}</div></main>;
}
