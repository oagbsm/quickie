"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSignUpConfirmationRedirect } from "@/lib/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const mail = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") || "");
    if (password.length < 10) {
      setMessage("Use at least 10 characters for your password.");
      setPending(false);
      return;
    }
    const { data, error } = await createSupabaseBrowserClient().auth.signUp({
      email: mail,
      password,
      options: {
        emailRedirectTo: getSignUpConfirmationRedirect(),
        data: {
          account_kind: "quickola_business",
          full_name: String(form.get("fullName")),
          business_name: `${String(form.get("fullName"))}'s properties`,
          customer_type: "str_operator",
        },
      },
    });
    if (error) {
      setMessage(error.message);
      setPending(false);
      return;
    }
    setEmail(mail);
    if (data.session) {
      router.push("/business/continue");
      router.refresh();
      return;
    }
    setSent(true);
    setPending(false);
  }

  async function resend() {
    setPending(true);
    const { error } = await createSupabaseBrowserClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getSignUpConfirmationRedirect() },
    });
    setMessage(
      error ? error.message : "A new confirmation link has been sent.",
    );
    setPending(false);
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-[#dbe1ea] bg-white px-4 py-3 outline-none focus:border-[#079448] focus:ring-2 focus:ring-[#079448]/15";

  if (sent)
    return (
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-black text-[#079448]">ACCOUNT CREATED</p>
        <h1 className="mt-2 text-3xl font-black">Check your email</h1>
        <p className="mt-4 leading-7 text-[#657089]">
          We’ve sent a confirmation link to{" "}
          <strong className="text-[#071638]">{email}</strong>. Click the link to
          activate your Quickola account.
        </p>
        {message && (
          <p
            className="mt-4 rounded-xl bg-[#f2f7f4] p-3 text-sm font-bold"
            aria-live="polite"
          >
            {message}
          </p>
        )}
        <div className="mt-7 grid gap-3">
          <button
            onClick={resend}
            disabled={pending}
            className="rounded-xl bg-[#079448] p-3 font-black text-white"
          >
            {pending ? "Sending…" : "Resend confirmation email"}
          </button>
          <button
            onClick={() => {
              setSent(false);
              setMessage("");
            }}
            className="rounded-xl border p-3 font-black"
          >
            Change email
          </button>
          <Link
            href="/business/sign-in"
            className="p-2 text-center text-sm font-black text-[#079448]"
          >
            Return to sign in
          </Link>
        </div>
      </section>
    );

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-3xl bg-white p-6 shadow-xl sm:p-8"
    >
      <div>
        <p className="text-sm font-black text-[#079448]">STEP 1 OF 4</p>
        <h1 className="mt-2 text-3xl font-black">Create your account</h1>
        <p className="mt-2 text-sm font-semibold text-[#657089]">
          No meeting or sales call required.
        </p>
      </div>
        <label className="font-bold">
          Full name
          <input
            className={fieldClass}
            name="fullName"
            autoComplete="name"
            minLength={2}
            required
          />
        </label>
      <label className="font-bold">
        Email
        <input
          className={fieldClass}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="font-bold">
        Password
        <input
          className={fieldClass}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <span className="mt-1 block text-xs font-semibold text-[#657089]">
          At least 10 characters.
        </span>
      </label>
      {message && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-xl bg-[#079448] px-5 py-3.5 font-black text-white disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Continue"}
      </button>
      <p className="text-center text-sm font-semibold text-[#657089]">
        Already registered?{" "}
        <Link
          href="/business/sign-in"
          className="font-black text-[#079448]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
