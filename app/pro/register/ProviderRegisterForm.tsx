import ProviderGoogleButton from "../login/ProviderGoogleButton";
import Link from "next/link";

export default function ProviderRegisterForm({ signupIntent = false }: { signupIntent?: boolean }) {
  return <div className="mt-6 rounded-2xl border border-[#e7ebef] bg-white p-5"><p className="text-sm leading-6 text-[#657089]">Use your Google account to create and manage your Quickola provider profile.</p><p className="mt-4 rounded-xl bg-[#f5fbf6] p-3 text-sm leading-6 text-[#39465b]">Quickola uses your information to create and operate your provider account, verify eligibility, match you with work, process payments and operate the marketplace. See our <Link href="/privacy-policy" className="font-black text-[#167d3c] underline">Privacy Notice</Link>.</p><ProviderGoogleButton next={signupIntent ? "/pro/register" : "/work/onboarding"} /><p className="mt-3 text-center text-xs font-bold text-[#8a95a5]">Quick, secure and no password needed.</p></div>;
}
