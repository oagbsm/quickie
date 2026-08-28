import Link from "next/link";
import ProviderRegisterForm from "./ProviderRegisterForm";
import { redirect } from "next/navigation";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";

export default async function ProviderRegisterPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  const account = await getCurrentAccountContext();
  if (account.role) redirect(destinationForAccount(account) || "/");
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-12 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-sm font-black text-[#159548]">JOIN QUICKOLA</p><h1 className="mt-2 text-3xl font-black">Earn money doing local jobs</h1><p className="mt-3 text-sm leading-6 text-[#657089]">Find customers in Maidenhead, choose the jobs you want and set your own price.</p><ul className="mt-5 grid gap-2 text-sm font-bold text-[#39465b]"><li>✓ Choose the jobs you want</li><li>✓ Set your own price</li><li>✓ Local Maidenhead opportunities</li></ul><ProviderRegisterForm signupIntent={intent === "provider-signup"} /><Link href="/pro/login" className="mt-5 block text-center text-sm font-black text-[#167d3c]">Already have an account? Sign in</Link></section></main>;
}
