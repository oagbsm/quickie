"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  acceptCleanerInvitation,
  prepareCleanerInvitationCredentials,
  type AcceptInvitationResult,
} from "./actions";

function invitationMessage(
  result: AcceptInvitationResult,
  email: string,
) {
  if (result.status === "email_mismatch")
    return `This invitation was sent to ${email}. Sign in with that email.`;
  if (result.status === "role_conflict")
    return "This account cannot accept this invitation. Check that you are signed in with the invited email.";
  if (result.status === "invitation_unavailable")
    return "This invitation is no longer available. Ask the business to resend it.";
  return "We couldn’t finish accepting the invitation. Please try again.";
}

export default function InvitationCredentials({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    const password = String(
      new FormData(event.currentTarget).get("password") || "",
    );
    if (password.length < 10 || password.length > 128) {
      setMessage("Use a password between 10 and 128 characters.");
      setPending(false);
      return;
    }

    try {
      const auth = createSupabaseBrowserClient({ authForm: true });
      const { error } = await auth.auth.signInWithPassword({ email, password });
      if (!error) {
        const accepted = await acceptCleanerInvitation({ token });
        if (accepted.status === "accepted") {
          window.location.replace("/cleaner/today");
          return;
        }
        setMessage(invitationMessage(accepted, email));
        setPending(false);
        return;
      }

      const prepared = await prepareCleanerInvitationCredentials({
        token,
        password,
      });
      if (prepared.status === "credentials_created") {
        const signedIn = await auth.auth.signInWithPassword({ email, password });
        if (!signedIn.error) {
          const accepted = await acceptCleanerInvitation({ token });
          if (accepted.status === "accepted") { window.location.replace("/cleaner/today"); return; }
          setMessage(invitationMessage(accepted, email));
        } else setMessage("We couldn’t sign you in after creating the account. Please try again.");
        setPending(false);
        return;
      }
      if (prepared.status === "sign_in_required") {
        setMessage(
          "An account already uses this email. Check your password and try again.",
        );
      } else if (prepared.status === "invitation_unavailable") {
        setMessage(
          "This invitation is no longer available. Ask the business to resend it.",
        );
      } else {
        setMessage("We couldn’t continue right now. Please try again shortly.");
      }
      setPending(false);
    } catch {
      setMessage("We couldn’t continue right now. Please try again shortly.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 grid gap-4">
      <label className="font-bold">
        Invited email
        <input
          value={email}
          readOnly
          aria-readonly="true"
          className="mt-1 min-h-12 w-full rounded-lg border bg-slate-50 px-3 text-[#526078]"
        />
      </label>
      <label className="font-bold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={10}
          maxLength={128}
          required
          aria-describedby="invitation-password-help"
          className="mt-1 min-h-12 w-full rounded-lg border px-3 outline-none focus:border-[#079448] focus:ring-4 focus:ring-[#079448]/15"
        />
      </label>
      <p id="invitation-password-help" className="text-sm text-[#657089]">
        Create a password for your Quickola account.
      </p>
      {message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800"
        >
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-12 rounded-lg bg-[#079448] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? "Accepting invitation…" : "Accept invitation"}
      </button>
      {message.startsWith("An account already") && (
        <Link
          href={`/auth/portal/sign-in?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/invite/${token}`)}&reset=1`}
          className="min-h-11 py-3 text-center text-sm font-bold text-[#079448]"
        >
          Forgot password?
        </Link>
      )}
    </form>
  );
}

export function InvitationAcceptButton({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function accept() {
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const result = await acceptCleanerInvitation({ token });
      if (result.status === "accepted") {
        window.location.replace("/cleaner/today");
        return;
      }
      setMessage(invitationMessage(result, email));
    } catch {
      setMessage("We couldn’t finish accepting the invitation. Please try again.");
    }
    setPending(false);
  }

  return (
    <div className="mt-7">
      {message && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 font-bold text-red-800">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={accept}
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-[#079448] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? "Accepting invitation…" : "Accept invitation"}
      </button>
    </div>
  );
}

export function InvitationAccountMismatch({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      await createSupabaseBrowserClient({ authForm: true }).auth.signOut({
        scope: "local",
      });
    } catch {
      // The proxy clears any stale cookie when the invitation reloads.
    } finally {
      window.location.replace(`/invite/${encodeURIComponent(token)}`);
    }
  }

  return (
    <div className="mt-7">
      <p role="alert" className="rounded-lg bg-amber-50 p-4 font-bold">
        This invitation was sent to {email}. Sign in with that email.
      </p>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="mt-4 min-h-12 w-full rounded-lg border font-extrabold disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out and continue"}
      </button>
    </div>
  );
}
