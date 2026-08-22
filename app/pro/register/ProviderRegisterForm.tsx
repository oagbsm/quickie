"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ProviderRegisterForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget); const email = String(form.get("email") || "").trim(); const password = String(form.get("password") || ""); const name = String(form.get("name") || "").trim();
    const origin = window.location.origin;
    const result = await createSupabaseBrowserClient({ authForm: true }).auth.signUp({ email, password, options: { data: { account_kind: "quickola_provider", full_name: name }, emailRedirectTo: `${origin}/auth/callback?next=%2Fwork%2Fonboarding` } });
    if (result.error) { setError("We couldn’t create that account. Check your details or sign in if you already have a Quickola account."); setPending(false); return; }
    if (result.data.session) window.location.assign("/work/onboarding"); else { setMessage("Check your email to confirm your account, then continue your provider setup."); setPending(false); }
  }
  return <form onSubmit={submit} className="mt-6 grid gap-4"><label className="font-bold">Full name<input name="name" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Email<input name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Password<input name="password" type="password" minLength={8} autoComplete="new-password" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}{message && <p className="rounded-xl bg-[#eef8f1] p-3 text-sm font-bold text-[#167d3c]">{message}</p>}<button disabled={pending} className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">{pending ? "Creating account…" : "Create provider account"}</button></form>;
}
