import Link from "next/link";
import ProviderGoogleButton from "./ProviderGoogleButton";

export default async function ProviderLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const message = error === "not-approved"
    ? "This Google account is not approved for provider work yet."
    : error === "unverified"
      ? "Please verify your email before continuing."
      : "Sign in with the Google account you use for Quickola provider work.";
  const providerNext = next?.startsWith("/work/") ? next : "/work/onboarding";
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-10 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">QUICKOLA PRO</p><h1 className="mt-2 text-3xl font-black">Sign in to Quickola</h1><p className="mt-3 text-sm leading-6 text-[#657089]">Manage your jobs, quotes and payouts.</p>{error && <p className="mt-4 rounded-xl bg-[#fff8e8] p-3 text-sm font-bold text-[#8a5a00]">{message}</p>}<ProviderGoogleButton next={providerNext} /><p className="mt-3 text-center text-xs font-bold text-[#8a95a5]">Quick, secure and no password needed.</p><Link href="/pro/register" className="mt-6 block text-center text-sm font-black text-[#167d3c]">New to Quickola? Become a provider</Link></section></main>;
}
