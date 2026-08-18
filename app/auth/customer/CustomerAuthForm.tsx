"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeInternalNextPath } from "@/lib/app-url";

export default function CustomerAuthForm() {
  const params = useSearchParams();
  const draft = /^[0-9a-f-]{36}$/i.test(params.get("draft") || "") ? params.get("draft")! : "";
  const next = safeInternalNextPath(params.get("next"), "/my-jobs");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    params.get("error") === "oauth"
      ? "Google sign-in was cancelled or could not be completed. Please try again."
      : params.get("error") === "profile"
        ? "Your account was verified, but we couldn’t finish setting up your customer profile. Please try again."
        : params.get("error")
          ? "We couldn’t complete sign in. Please try again."
          : "",
  );

  async function continueWithGoogle() {
    setPending(true);
    setMessage("");
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (draft) redirectTo.searchParams.set("draft", draft);
    redirectTo.searchParams.set("next", next || "/my-jobs");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) {
      setMessage("Google sign-in is unavailable right now. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5 rounded-3xl bg-white p-7 shadow-lg">
      <div>
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola account</p>
        <h1 className="mt-2 text-3xl font-black text-[#061b3f]">Sign in to Quickola</h1>
        <p className="mt-2 text-sm leading-6 text-[#657089]">Continue with Google to view your jobs and offers.</p>
      </div>
      <button type="button" onClick={continueWithGoogle} disabled={pending} className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#dbe1ea] bg-white font-black text-[#061b3f] shadow-sm disabled:opacity-60">
        <GoogleIcon />
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {message && <p role="status" className="rounded-xl bg-[#fff3e7] p-3 text-sm font-bold text-[#974c00]">{message}</p>}
    </div>
  );
}

function GoogleIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.41h5.37a4.58 4.58 0 0 1-1.99 3v2.5h3.22c1.89-1.74 2.75-4.3 2.75-7.11Z"/><path fill="#34A853" d="M12 21.75c2.7 0 4.97-.9 6.63-2.44l-3.22-2.5c-.9.6-2.05.96-3.41.96-2.62 0-4.84-1.77-5.64-4.15H3.03v2.58A10 10 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.36 13.62A5.98 5.98 0 0 1 6.05 12c0-.56.1-1.1.31-1.62V7.8H3.03A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.03 4.2l3.33-2.58Z"/><path fill="#EA4335" d="M12 6.23c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 3.2 14.7 2.25 12 2.25a10 10 0 0 0-8.97 5.54l3.33 2.59C7.16 8 9.38 6.23 12 6.23Z"/></svg>;
}
