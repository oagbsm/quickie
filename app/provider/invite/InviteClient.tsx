"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createInvitedProviderAccount } from "./actions";

export default function InviteClient({ token, email }: { token: string; email: string }) {
  const [emailValue, setEmailValue] = useState(email);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    const auth = createSupabaseBrowserClient({ authForm: true });
    if (mode === "signup") {
      const created = await createInvitedProviderAccount({ token, email: emailValue, password });
      if (!created.ok) {
        setError(created.error === "already_exists" ? "An account already exists for this invited email. Switch to sign in." : "We couldn’t create your provider account. Check the invited email and try again.");
        setPending(false);
        return;
      }
    }
    const result = await auth.auth.signInWithPassword({ email: emailValue, password });
    if (result.error) { setError("We couldn’t continue. Check the invited email and your password."); setPending(false); return; }
    window.location.assign(`/provider/invite/accept?token=${encodeURIComponent(token)}`);
  }
  async function google() {
    setPending(true); setError(""); const redirectTo = new URL("/auth/callback", window.location.origin); redirectTo.searchParams.set("provider_invite", token); const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } }); if (authError) { setError("Google sign-in is unavailable right now."); setPending(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-12 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-sm font-black text-[#159548]">QUICKOLA PROVIDER INVITATION</p><h1 className="mt-2 text-3xl font-black">Join Quickola as a provider</h1><p className="mt-3 text-sm leading-6 text-[#657089]">Browse local jobs and send customers your price.</p><button type="button" onClick={google} disabled={pending} className="mt-6 min-h-12 w-full rounded-xl border border-[#dbe1ea] font-black">Continue with Google</button><div className="my-5 border-t pt-5"><button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-sm font-black text-[#167d3c]">{mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}</button><form onSubmit={submit} className="mt-4 grid gap-4"><label className="font-bold">Email<input value={emailValue} onChange={(event) => setEmailValue(event.target.value)} type="email" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="font-bold">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}<button disabled={pending} className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">{mode === "signup" ? "Create account and join" : "Sign in and join"}</button></form></div></section></main>;
}
