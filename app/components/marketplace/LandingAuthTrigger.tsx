"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const AUTH_PANEL_EVENT = "quickola-auth-panel";

export default function LandingAuthTrigger({ label = "Get started", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  const instanceId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [create, setCreate] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const closeOtherPanels = (event: Event) => { if ((event as CustomEvent<string>).detail !== instanceId) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener(AUTH_PANEL_EVENT, closeOtherPanels);
    window.addEventListener("keydown", closeOnEscape);
    return () => { window.removeEventListener(AUTH_PANEL_EVENT, closeOtherPanels); window.removeEventListener("keydown", closeOnEscape); };
  }, [instanceId]);

  async function openAuth() {
    setPending(true);
    const { data } = await createSupabaseBrowserClient().auth.getSession();
    if (data.session) {
      router.push("/my-jobs");
      return;
    }
    setOpen(true);
    window.dispatchEvent(new CustomEvent(AUTH_PANEL_EVENT, { detail: instanceId }));
    setPending(false);
  }

  async function continueWithGoogle() {
    setPending(true);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/my-jobs");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
    if (error) { setMessage("Google sign-in is unavailable right now."); setPending(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const auth = createSupabaseBrowserClient();
    if (step === "email") {
      if (!email.trim()) { setMessage("Enter your email address."); setPending(false); return; }
      setStep("password");
      setPending(false);
      return;
    }
    const result = create
      ? await auth.auth.signUp({ email: email.trim(), password, options: { data: { account_kind: "quickola_marketplace" }, emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fportal` } })
      : await auth.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) { setMessage(create ? "We couldn’t create that account. Try signing in instead." : "That email or password didn’t work."); setPending(false); return; }
    if (create && !result.data.session) { setMessage("Check your email to confirm your account, then sign in."); setPending(false); return; }
      router.push("/my-jobs");
  }

  return <div className="relative"><button type="button" onClick={openAuth} disabled={pending} className={className}>{pending && !open ? "Opening…" : label}</button>{open && <div className="absolute right-0 top-[calc(100%+12px)] z-[80] w-[min( calc(100vw-2rem),360px)] rounded-2xl border border-[#e7ebef] bg-white p-5 text-left text-[#061b3f] shadow-[0_18px_55px_rgba(6,27,63,.18)]" role="dialog" aria-label="Sign in to Quickola"><button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-3 text-xl text-[#657089]" aria-label="Close">×</button><p className="pr-6 text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola</p><h2 className="mt-2 text-xl font-black">Get started with Quickola</h2>{message && <p role="alert" className="mt-3 rounded-xl bg-[#fff3e7] p-3 text-sm font-bold text-[#974c00]">{message}</p>}{step === "email" ? <form onSubmit={submit} className="mt-4"><label className="text-sm font-black">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@email.com" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><button disabled={pending} className="mt-3 min-h-12 w-full rounded-xl bg-[#23a955] font-black text-[#061b3f]">Continue</button></form> : <form onSubmit={submit} className="mt-4"><label className="text-sm font-black">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={create ? "new-password" : "current-password"} minLength={6} required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><button disabled={pending} className="mt-3 min-h-12 w-full rounded-xl bg-[#23a955] font-black text-[#061b3f]">{create ? "Create account" : "Sign in"}</button><button type="button" onClick={() => setCreate((value) => !value)} className="mt-3 w-full text-sm font-black text-[#167d3c]">{create ? "Already have an account? Sign in" : "New to Quickola? Create an account"}</button></form>}<div className="my-4 flex items-center gap-3 text-xs font-bold text-[#9aa4b3]"><span className="h-px flex-1 bg-[#e7ebef]" />OR<span className="h-px flex-1 bg-[#e7ebef]" /></div><button type="button" onClick={continueWithGoogle} disabled={pending} className="min-h-12 w-full rounded-xl border border-[#dbe1ea] font-black">Continue with Google</button></div>}</div>;
}
