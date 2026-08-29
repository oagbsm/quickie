"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildAbsoluteAppUrl, safeInternalNextPath } from "@/lib/app-url";
import GoogleLogo from "@/app/components/auth/GoogleLogo";

export default function CustomerAuthForm() {
  const params = useSearchParams();
  const draft = /^[0-9a-f-]{36}$/i.test(params.get("draft") || "") ? params.get("draft")! : "";
  const next = safeInternalNextPath(params.get("next"), "/my-jobs");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function continueWithGoogle() {
    setPending(true);
    setMessage("");
    const redirectTo = new URL(buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }));
    if (draft) redirectTo.searchParams.set("draft", draft);
    redirectTo.searchParams.set("next", next);
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) {
      setMessage("Google sign-in is unavailable right now. Please try again.");
      setPending(false);
    }
  }

  return <section className="grid gap-5 rounded-3xl bg-white p-6 shadow-lg sm:p-7"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">QUICKOLA ACCOUNT</p><h1 className="mt-2 text-3xl font-black text-[#061b3f]">Sign in to Quickola</h1><p className="mt-2 text-sm leading-6 text-[#657089]">{draft ? "Your job details are saved. Sign in with Google to publish your job." : "Post jobs, receive quotes and manage your bookings."}</p></div>{message && <p role="alert" className="rounded-xl bg-[#fff3e7] p-3 text-sm font-bold text-[#974c00]">{message}</p>}<button type="button" onClick={continueWithGoogle} disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f] disabled:opacity-60"><GoogleLogo />{pending ? "Opening Google…" : "Continue with Google"}</button><p className="text-center text-xs font-bold text-[#8a95a5]">Quick, secure and no password needed.</p></section>;
}
