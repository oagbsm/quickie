"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPasswordRecoveryRedirect } from "@/lib/auth-redirects";
import { safeInternalNextPath } from "@/lib/app-url";
export default function SignInForm() {
  const router = useRouter(),
    params = useSearchParams();
  const next = safeInternalNextPath(params.get("next"), ""),
    invitationPath = next.startsWith("/invite/") || next.startsWith("/team/invite/"),
    cleanerPath = invitationPath || next.startsWith("/cleaner/"),
    returnPath = invitationPath
      ? next
      : `/auth/portal${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(
      params.get("error") === "confirmation"
        ? "That confirmation link could not establish a session. Request a new link or sign in."
        : params.get("reset") === "success"
          ? "Password updated successfully. Sign in with your new password."
          : "",
    );
  const resetButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (params.get("reset") === "1") resetButton.current?.click();
  }, [params]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const f = new FormData(e.currentTarget);
    try {
      const { error } =
        await createSupabaseBrowserClient({ authForm: true }).auth.signInWithPassword({
        email: String(f.get("email")),
        password: String(f.get("password")),
      });
      if (error) {
        setMessage("We couldn’t sign you in. Check your details and try again.");
        setPending(false);
        return;
      }
      router.replace(returnPath);
      router.refresh();
    } catch {
      setMessage("We couldn’t sign you in right now. Please try again shortly.");
      setPending(false);
    }
  }
  async function reset(e: FormEvent<HTMLButtonElement>) {
    const email = (
      e.currentTarget.form?.elements.namedItem("email") as HTMLInputElement
    )?.value;
    if (!email) {
      setMessage("Enter your email first, then select forgot password.");
      return;
    }
    setPending(true);
    try {
      const { error } =
        await createSupabaseBrowserClient({ authForm: true }).auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordRecoveryRedirect(),
      });
      setMessage(
        error
          ? "We couldn’t send reset instructions right now. Please try again."
          : "Password reset instructions have been sent.",
      );
      setPending(false);
    } catch {
      setMessage("We couldn’t send reset instructions right now. Please try again.");
      setPending(false);
    }
  }
  const c =
    "mt-1.5 w-full rounded-xl border border-[#dbe1ea] px-4 py-3 outline-none focus:border-[#079448] focus:ring-2 focus:ring-[#079448]/15";
  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-2xl bg-white p-7 shadow-lg"
    >
      <div>
        <p className="eyebrow">{invitationPath ? "Cleaner invitation" : cleanerPath ? "Cleaner account" : "Customer account"}</p>
        <h1 className="mt-2 text-3xl font-extrabold">{invitationPath ? "Sign in to accept your invitation" : cleanerPath ? "Sign in to your cleaner portal" : "Sign in to Quickola"}</h1>
        <p className="mt-2 text-sm leading-6 text-[#657089]">
          {invitationPath ? "Use the invited email to continue to your cleaner invitation." : cleanerPath ? "Use the email connected to your accepted worker invitation." : "Access your properties, cleans and guest-ready evidence."}
        </p>
      </div>
      <label className="font-bold">
        Email
        <input
          className={c}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={params.get("email") || ""}
          readOnly={invitationPath && Boolean(params.get("email"))}
        />
      </label>
      <label className="font-bold">
        Password
        <input
          className={c}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl bg-[#f2f7f4] p-3 text-sm font-bold"
        >
          {message}
        </p>
      )}
      <button
        ref={resetButton}
        disabled={pending}
        className="min-h-12 rounded-xl bg-[#079448] py-3.5 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={pending}
        className="min-h-11 text-sm font-bold text-[#079448]"
      >
        Forgot password?
      </button>
      {!cleanerPath && <p className="text-center text-sm font-semibold">
        Need an operator account?{" "}
        <Link href="/business/sign-up" className="font-bold text-[#079448]">
          Create account
        </Link>
      </p>}
    </form>
  );
}
