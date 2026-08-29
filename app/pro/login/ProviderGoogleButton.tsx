"use client";

import { useState } from "react";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import GoogleLogo from "@/app/components/auth/GoogleLogo";

const OAUTH_START_TIMEOUT_MS = 12_000;

export default function ProviderGoogleButton({ next = "/work/onboarding", providerInvite }: { next?: string; providerInvite?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function continueWithGoogle() {
    setPending(true);
    setError("");
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const redirectTo = new URL(buildAbsoluteAppUrl("/auth/callback", { browserOrigin: window.location.origin }));
      redirectTo.searchParams.set("next", next);
      if (providerInvite) redirectTo.searchParams.set("provider_invite", providerInvite);
      if (process.env.NODE_ENV === "development") console.info("[provider-oauth] start", { provider: "google", callbackOrigin: redirectTo.origin, callbackPath: redirectTo.pathname });
      const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!configuredSupabaseUrl) throw new Error("Supabase is not configured.");
      const expectedSupabaseHost = new URL(configuredSupabaseUrl).hostname;
      const oauthStart = createSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString(), skipBrowserRedirect: true },
      });
      const timedOut = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          if (process.env.NODE_ENV === "development") console.warn("[provider-oauth] timeout", { provider: "google", callbackOrigin: redirectTo.origin, callbackPath: redirectTo.pathname });
          resolve(null);
        }, OAUTH_START_TIMEOUT_MS);
      });
      const result = await Promise.race([oauthStart, timedOut]);
      if (!result) {
        setError("Google sign-in is taking too long. Please try again.");
        return;
      }
      if (result.error) {
        if (process.env.NODE_ENV === "development") console.warn("[provider-oauth] returned error", { provider: "google", name: result.error.name, code: result.error.code });
        setError("Google sign-in could not be opened. Please try again.");
        return;
      }
      if (!result.data?.url) {
        if (process.env.NODE_ENV === "development") console.warn("[provider-oauth] missing URL", { provider: "google" });
        setError("Google sign-in could not be opened. Please try again.");
        return;
      }
      const oauthUrl = new URL(result.data.url);
      if (oauthUrl.protocol !== "https:" || oauthUrl.hostname !== expectedSupabaseHost) {
        if (process.env.NODE_ENV === "development") console.warn("[provider-oauth] invalid destination", { provider: "google", hostname: oauthUrl.hostname, expectedHost: expectedSupabaseHost });
        setError("Google sign-in could not be opened. Please try again.");
        return;
      }
      if (process.env.NODE_ENV === "development") console.info("[provider-oauth] navigation started", { provider: "google", hostname: oauthUrl.hostname });
      window.location.assign(oauthUrl.toString());
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.warn("[provider-oauth] startup failed", { provider: "google", name: error instanceof Error ? error.name : typeof error });
      setError("Google sign-in could not be opened. Please try again.");
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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
        <span className="mr-2 inline-flex align-middle"><GoogleLogo /></span>
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
