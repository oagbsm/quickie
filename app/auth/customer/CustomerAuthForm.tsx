"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildAbsoluteAppUrl, safeInternalNextPath } from "@/lib/app-url";

export default function CustomerAuthForm() {
  const params = useSearchParams();
  const draft = /^[0-9a-f-]{36}$/i.test(params.get("draft") || "") ? params.get("draft")! : "";
  const next = safeInternalNextPath(params.get("next"), "/my-jobs");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [create, setCreate] = useState(params.get("mode") === "signup");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function continueWithGoogle() {
    setPending(true);
    setMessage("");
    const redirectTo = new URL(buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }));
    if (draft) redirectTo.searchParams.set("draft", draft);
    redirectTo.searchParams.set("next", next || "/my-jobs");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
    if (error) { setMessage("Google sign-in is unavailable right now. Please try again."); setPending(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const auth = createSupabaseBrowserClient();
    const result = create
      ? await auth.auth.signUp({ email: email.trim(), password, options: { data: { account_kind: "quickola_marketplace" }, emailRedirectTo: `${buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin })}?draft=${encodeURIComponent(draft)}&next=%2Fmy-jobs` } })
      : await auth.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) { setMessage(create ? "We couldn’t create that account. Try signing in instead." : "That email or password didn’t work."); setPending(false); return; }
    if (create && !result.data.session) { setMessage("Check your email to confirm your account. Your job details will remain saved."); setPending(false); return; }
    if (draft) window.location.assign(`/auth/customer/publish?draft=${encodeURIComponent(draft)}`);
    else window.location.assign(next || "/my-jobs");
  }

  return <div className="grid gap-5 rounded-3xl bg-white p-7 shadow-lg"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola account</p><h1 className="mt-2 text-3xl font-black text-[#061b3f]">{draft ? "Sign in to post your job" : "Sign in to Quickola"}</h1><p className="mt-2 text-sm leading-6 text-[#657089]">{draft ? "Your job details are saved. Sign in or create an account to publish them." : "View your jobs and offers."}</p></div><form onSubmit={submit} className="grid gap-4"><label className="font-bold">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Password<input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" autoComplete={create ? "new-password" : "current-password"} minLength={6} required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label>{message && <p role="alert" className="rounded-xl bg-[#fff3e7] p-3 text-sm font-bold text-[#974c00]">{message}</p>}<button disabled={pending} className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">{pending ? "Continuing…" : create ? "Create account & post job" : draft ? "Sign in & post job" : "Sign in"}</button></form><button type="button" onClick={() => setCreate((value) => !value)} className="text-sm font-black text-[#167d3c]">{create ? "Already have an account? Sign in" : "New to Quickola? Create an account"}</button><div className="flex items-center gap-3 text-xs font-bold text-[#9aa4b3]"><span className="h-px flex-1 bg-[#e7ebef]" />OR<span className="h-px flex-1 bg-[#e7ebef]" /></div><button type="button" onClick={continueWithGoogle} disabled={pending} className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#dbe1ea] bg-white font-black text-[#061b3f] disabled:opacity-60">Continue with Google</button></div>;
}
