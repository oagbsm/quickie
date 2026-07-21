"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (password.length < 10) { setMessage("Use at least 10 characters for your password."); setPending(false); return; }
    const supabase = createSupabaseBrowserClient();
    const { data: result, error } = await supabase.auth.signUp({
      email: String(data.get("email")), password,
      options: { emailRedirectTo: `${window.location.origin}/business/onboarding`, data: {
        account_kind: "quickola_business", full_name: String(data.get("fullName")), business_name: String(data.get("businessName")), phone: String(data.get("phone")), customer_type: String(data.get("customerType")),
      } },
    });
    if (error) { setMessage(error.message); setPending(false); return; }
    if (result.session) { router.push("/business/onboarding"); router.refresh(); return; }
    setMessage("Check your email to confirm your account, then continue to add your first property."); setPending(false);
  }
  const field = "mt-1.5 w-full rounded-xl border border-[#dbe1ea] bg-white px-4 py-3 outline-none focus:border-[#079448] focus:ring-2 focus:ring-[#079448]/15";
  return <form onSubmit={submit} className="grid gap-5 rounded-3xl bg-white p-6 shadow-xl sm:p-8">
    <div><p className="text-sm font-black text-[#079448]">STEP 1 OF 4</p><h1 className="mt-2 text-3xl font-black">Create your business account</h1><p className="mt-2 text-sm font-semibold text-[#657089]">No meeting or contract call required.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Full name<input className={field} name="fullName" autoComplete="name" minLength={2} required /></label><label className="font-bold">Business or trading name<input className={field} name="businessName" autoComplete="organization" minLength={2} required /></label></div>
    <label className="font-bold">Work email<input className={field} name="email" type="email" autoComplete="email" required /></label>
    <label className="font-bold">Phone number<input className={field} name="phone" type="tel" autoComplete="tel" required /></label>
    <label className="font-bold">Customer type<select className={field} name="customerType" required defaultValue=""><option value="" disabled>Select one</option><option value="landlord">Landlord</option><option value="airbnb_operator">Airbnb operator</option><option value="letting_agent">Letting agent</option><option value="property_manager">Property manager</option><option value="office_business">Office or business</option><option value="block_manager">Block manager</option><option value="other">Other</option></select></label>
    <label className="font-bold">Password<input className={field} name="password" type="password" autoComplete="new-password" minLength={10} required /><span className="mt-1 block text-xs font-semibold text-[#657089]">At least 10 characters.</span></label>
    {message && <p className="rounded-xl bg-[#f2f7f4] p-3 text-sm font-bold" aria-live="polite">{message}</p>}
    <button disabled={pending} className="rounded-xl bg-[#079448] px-5 py-3.5 font-black text-white disabled:opacity-60">{pending ? "Creating account…" : "Continue"}</button>
    <p className="text-center text-sm font-semibold text-[#657089]">Already registered? <Link href="/business/sign-in" className="font-black text-[#079448]">Sign in</Link></p>
  </form>;
}
