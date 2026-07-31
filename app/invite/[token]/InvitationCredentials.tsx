"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildAbsoluteAppUrl } from "@/lib/app-url";

export default function InvitationCredentials({ email, token }: { email: string; token: string }) {
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setCreating(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password.length < 10) { setMessage("Use at least 10 characters for your password."); setCreating(false); return; }
    const confirmationRedirect = new URL(buildAbsoluteAppUrl("/auth/callback"));
    confirmationRedirect.searchParams.set("next", `/invite/${token}`);
    confirmationRedirect.searchParams.set("email", email);
    const { data, error } = await createSupabaseBrowserClient().auth.signUp({
      email, password,
      options: { emailRedirectTo: confirmationRedirect.toString(), data: { account_kind: "quickola_cleaner" } },
    });
    if (error) { setMessage("We couldn’t create your credentials. Try signing in if you already have an account."); setCreating(false); return; }
    if (data.user?.identities?.length === 0) { setMessage("An account already exists for this email. Sign in to continue the invitation."); setCreating(false); return; }
    if (data.session) window.location.assign(`/invite/${token}`);
    else { setSent(true); setCreating(false); }
  }
  if (sent) return <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 font-bold text-emerald-900">Check {email} to confirm your email, then Quickola will return you to this invitation.</p>;
  return <div className="mt-7 grid gap-4">
    <Link href={`/business/sign-in?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/invite/${token}`)}`} className="flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] font-extrabold text-white">Sign in to accept</Link>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-extrabold">New to Quickola? Create credentials</summary>
      <form onSubmit={submit} className="mt-4 grid gap-3"><label className="font-bold">Invited email<input value={email} readOnly aria-readonly="true" className="mt-1 min-h-12 w-full rounded-lg border bg-slate-50 px-3" /></label><label className="font-bold">Create password<input name="password" type="password" autoComplete="new-password" minLength={10} required className="mt-1 min-h-12 w-full rounded-lg border px-3" /></label>{message && <p role="alert" className="text-sm font-bold text-red-800">{message}</p>}<button disabled={creating} className="min-h-12 rounded-lg bg-[#079448] font-extrabold text-white disabled:opacity-60">{creating ? "Creating credentials…" : "Create credentials"}</button></form>
    </details>
  </div>;
}
