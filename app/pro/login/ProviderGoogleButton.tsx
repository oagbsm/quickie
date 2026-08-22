"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ProviderGoogleButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function continueWithGoogle() {
    setPending(true);
    setError("");
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/work/onboarding");
    const result = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (result.error) {
      setError("Google sign-in is unavailable right now.");
      setPending(false);
    }
  }
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={pending}
        className="min-h-12 w-full rounded-xl border border-[#dbe1ea] font-black disabled:opacity-60"
      >
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
