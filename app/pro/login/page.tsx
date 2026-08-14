import Link from "next/link";
import { providerSignIn } from "@/app/pro/actions";
import ProviderGoogleButton from "./ProviderGoogleButton";

export default async function ProviderLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "not-approved"
    ? "Provider access isn't enabled for this account."
    : error === "credentials"
      ? "Those sign-in details didn’t work."
      : error === "details"
        ? "Enter your email and password."
        : "Sign in with the account Quickola approved for provider work.";
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-12 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-sm font-black text-[#159548]">QUICKOLA WORK</p><h1 className="mt-2 text-3xl font-black">Provider sign in</h1><p className="mt-3 text-sm leading-6 text-[#657089]">{message}</p><ProviderGoogleButton /><div className="my-5 border-t pt-5"><p className="text-sm font-bold text-[#657089]">Or use your Quickola email and password</p><form action={providerSignIn} className="mt-4 grid gap-4"><label className="font-bold">Email<input name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><button className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">Sign in to work</button></form></div><Link href="/my-jobs" className="mt-5 block text-sm font-black text-[#167d3c]">Back to My Jobs</Link></section></main>;
}
