import { signOut } from "@/app/business/actions";
import { requireCleanerUser } from "@/lib/cleaner/auth";
import CleanerNavigation from "../CleanerNavigation";

export default async function Page() {
  const { supabase, workerId } = await requireCleanerUser();
  const { data: worker } = await supabase
    .from("workers")
    .select("display_name,company_name,email,mobile,preferred_contact_method")
    .eq("id", workerId)
    .maybeSingle();
  return <><p className="text-sm font-extrabold text-[#2d67b2]">ACCOUNT</p><h1 className="mt-1 text-3xl font-extrabold">Profile</h1><section className="mt-6 rounded-xl border bg-white p-5"><dl className="grid gap-4"><div><dt className="text-sm font-bold text-[#748096]">Name</dt><dd className="font-extrabold">{worker?.display_name}</dd></div><div><dt className="text-sm font-bold text-[#748096]">Business</dt><dd>{worker?.company_name||"Not provided"}</dd></div><div><dt className="text-sm font-bold text-[#748096]">Contact</dt><dd>{worker?.email||worker?.mobile}</dd></div><div><dt className="text-sm font-bold text-[#748096]">Preferred contact</dt><dd className="capitalize">{worker?.preferred_contact_method}</dd></div></dl><form action={signOut}><button className="mt-6 min-h-11 rounded-lg border px-4 font-extrabold text-red-700">Sign out</button></form></section><CleanerNavigation /></>;
}
