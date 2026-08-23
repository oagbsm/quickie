"use client";

import { useState } from "react";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function InviteClient({ token, email }: { token: string; email: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    setPending(true);
    setError("");
    const redirectTo = new URL(buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }));
    redirectTo.searchParams.set("provider_invite", token);
    const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
    if (authError) {
      setError("Google sign-in is unavailable right now. Please try again.");
      setPending(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-10 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">QUICKOLA PROVIDER INVITATION</p><h1 className="mt-2 text-3xl font-black">Join Quickola as a provider</h1><p className="mt-3 text-sm leading-6 text-[#657089]">Manage jobs, send quotes and receive payouts through your Google account.</p><p className="mt-4 rounded-xl bg-[#f7f8fa] p-3 text-sm font-bold text-[#526078]">This invitation is for {email}.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}<button type="button" onClick={continueWithGoogle} disabled={pending} className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#23a955] font-black text-[#061b3f] disabled:opacity-60"><span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4]">G</span>{pending ? "Opening Google…" : "Continue with Google"}</button><p className="mt-3 text-center text-xs font-bold text-[#8a95a5]">Quick, secure and no password needed.</p></section></main>;
}
