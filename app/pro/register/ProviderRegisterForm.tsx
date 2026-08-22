"use client";

import { useState } from "react";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ProviderRegisterForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const mail = String(form.get("email") || "").trim().toLowerCase();
    const name = String(form.get("name") || "").trim();
    const result = await createSupabaseBrowserClient({ authForm: true }).auth.signUp({
      email: mail,
      password: String(form.get("password") || ""),
      options: {
        data: { account_kind: "quickola_provider", full_name: name },
        emailRedirectTo: buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }) + "?next=%2Fwork%2Fonboarding",
      },
    });
    if (result.error) {
      setError("We couldn’t create that account. Check your details or sign in if you already have a Quickola account.");
      setPending(false);
      return;
    }
    setEmail(mail);
    if (result.data.session) window.location.assign("/work/onboarding");
    else {
      setSent(true);
      setMessage("We’ve sent a verification link. Verify your email, then sign in to continue your provider setup.");
      setPending(false);
    }
  }

  async function resend() {
    if (!email || pending || cooldown > 0) return;
    setPending(true);
    const { error: resendError } = await createSupabaseBrowserClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }) + "?next=%2Fwork%2Fonboarding" } });
    setMessage(resendError ? "We couldn’t resend the verification email. Please wait and try again." : "A new verification link has been sent.");
    setPending(false);
    if (!resendError) {
      setCooldown(60);
      const timer = window.setInterval(() => setCooldown((value) => { if (value <= 1) { window.clearInterval(timer); return 0; } return value - 1; }), 1000);
    }
  }

  if (sent) return <section className="mt-6 rounded-2xl bg-[#eef8f1] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">VERIFY YOUR EMAIL</p><h2 className="mt-2 text-2xl font-black">Check your inbox</h2><p className="mt-3 text-sm leading-6 text-[#526078]">We sent a verification link to <strong>{email}</strong>. Your provider account is created, but you must verify this address before submitting for review.</p>{message && <p className="mt-3 text-sm font-bold text-[#167d3c]">{message}</p>}<button type="button" onClick={resend} disabled={pending || cooldown > 0} className="mt-4 min-h-11 rounded-xl border border-[#b9dec5] px-4 text-sm font-black disabled:opacity-50">{cooldown > 0 ? `Resend available in ${cooldown}s` : pending ? "Sending…" : "Resend verification email"}</button></section>;

  return <form onSubmit={submit} className="mt-6 grid gap-4"><label className="font-bold">Full name<input name="name" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Email<input name="email" type="email" autoComplete="email" required onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Password<input name="password" type="password" minLength={8} autoComplete="new-password" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}{message && <p className="rounded-xl bg-[#eef8f1] p-3 text-sm font-bold text-[#167d3c]">{message}</p>}<button disabled={pending} className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">{pending ? "Creating account…" : "Create provider account"}</button></form>;
}
