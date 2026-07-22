"use client";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function Page() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#061a3d] p-5 text-white">Loading…</main>}><UpdatePasswordForm /></Suspense>;
}

function UpdatePasswordForm() {
  const params = useSearchParams(), admin = params.get("admin") === "1";
  const [message,setMessage]=useState(""),[done,setDone]=useState(false),[pending,setPending]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const p=String(new FormData(e.currentTarget).get("password")||"");if(p.length<10){setMessage("Use at least 10 characters.");return}setPending(true);const client=createSupabaseBrowserClient(),{error}=await client.auth.updateUser({password:p});if(error){setMessage(error.message);setPending(false);return}await client.auth.signOut();setDone(true);setPending(false)}
  return <main className="grid min-h-screen place-items-center bg-[#061a3d] p-5"><section className="w-full max-w-md rounded-3xl bg-white p-8">{done?<><h1 className="text-3xl font-black">Password updated successfully.</h1><p className="mt-3 text-[#657089]">Sign in with your new password to continue.</p><Link href={admin?"/admin/login":"/business/sign-in?reset=success"} className="mt-6 block rounded-xl bg-[#079448] p-3 text-center font-black text-white">Continue to sign in</Link></>:<form onSubmit={submit} className="grid gap-5"><h1 className="text-3xl font-black">Choose a new password</h1><label className="font-bold">New password<input name="password" type="password" autoComplete="new-password" minLength={10} required className="mt-2 w-full rounded-xl border p-3"/></label>{message&&<p aria-live="polite" className="text-sm font-bold text-red-700">{message}</p>}<button disabled={pending} className="rounded-xl bg-[#079448] p-3 font-black text-white">{pending?"Updating…":"Update password"}</button></form>}</section></main>;
}
