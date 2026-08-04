import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { addWorker, skipCleanerOnboarding } from "../str-actions";
import PropertyBasicsForm from "./PropertyBasicsForm";
import PendingButton from "@/app/components/PendingButton";

const field = "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";

export default async function Page({ searchParams }: { searchParams: Promise<{ step?: string; property?: string; error?: string }> }) {
  const { supabase, accountId } = await requireBusinessUser();
  const q = await searchParams;
  const [{ data: properties, count: propertyCount, error: propertiesError }, { data: account, error: accountError }] = await Promise.all([
    supabase.from("properties").select("id,nickname", { count: "exact" }).eq("account_id", accountId).order("created_at").limit(1),
    supabase.from("business_accounts").select("onboarding_step,onboarding_completed_at").eq("id", accountId).maybeSingle(),
  ]);
  if (propertiesError) throw new Error(`property_count_query_failed:${propertiesError.code}`);
  if (accountError) throw new Error(`onboarding_state_query_failed:${accountError.code}`);
  if (account?.onboarding_step === "complete" || account?.onboarding_completed_at) redirect("/business/dashboard");

  // The database is authoritative. A stale or user-edited query string must
  // not make a returning owner repeat a completed step.
  const step = (propertyCount ?? 0) > 0 ? "cleaner" : "property";
  const propertyId = q.property || properties?.[0]?.id;
  if (step === "cleaner" && !propertyId) redirect("/business/onboarding?step=property");
  const number = step === "property" ? 1 : 2;
  const compact = step === "property";
  const errorMessage = q.error === "save"
    ? "We couldn’t add the cleaner. No new invitation was saved. Please try again."
    : q.error === "state"
      ? "We couldn’t verify your onboarding state. Please try again."
      : null;

  return <main className={`min-h-screen bg-[#f3f6f9] px-5 ${compact ? "py-5" : "py-10"} sm:py-10`}><div className="mx-auto max-w-3xl"><Link href="/" className="text-xl font-extrabold">Quickola</Link><div className={`${compact ? "mt-5 gap-1.5" : "mt-8 gap-2"} flex sm:mt-8 sm:gap-2`} aria-label={`Onboarding step ${number} of 2`}>{[1, 2].map((n) => <span key={n} className={`${compact ? "h-1 rounded-full" : "h-1.5"} flex-1 ${n <= number ? "bg-[#2d67b2]" : "bg-[#d5dce5]"}`} />)}</div><p className={`${compact ? "mt-5" : "mt-7"} text-sm font-extrabold text-[#2d67b2] sm:mt-7`}>STEP {number} OF 2</p>
    {errorMessage && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{errorMessage}</p>}
    {step === "property" ? <><h1 className="mt-1 text-3xl font-extrabold">Add your first property</h1><p className="mt-1 text-[#59677d] sm:mt-2">Start with the core property details.</p><PropertyBasicsForm /></> : <><h1 className="mt-2 text-3xl font-extrabold">Add your cleaner or contractor</h1><p className="mt-2 text-[#59677d]">Invite the person or business you already use. You can skip this and add them later.</p><form action={addWorker} className="mt-6 grid gap-5 rounded-xl border bg-white p-5 sm:p-7"><input type="hidden" name="returnTo" value="onboarding" /><label className="font-bold">Name<input name="displayName" required className={field} /></label><label className="font-bold">Business name <span className="font-normal text-[#59677d]">(optional)</span><input name="companyName" className={field} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Email <span aria-hidden="true">*</span><input name="email" type="email" required className={field} /></label><label className="font-bold">Mobile number <span className="font-normal text-[#59677d]">(optional)</span><input name="mobile" type="tel" className={field} /></label></div><PendingButton idle="Add cleaner and enter dashboard" pending="Adding cleaner…" className="min-h-12 rounded-lg bg-[#071f49] font-extrabold text-white" /></form><form action={skipCleanerOnboarding}><button className="mt-3 min-h-11 w-full font-bold text-[#526078] underline">Skip for now</button></form></>}
  </div></main>;
}
