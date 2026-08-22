import Link from "next/link";
import ProviderRegisterForm from "./ProviderRegisterForm";

export default function ProviderRegisterPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-12 text-[#061b3f]"><section className="w-full max-w-md rounded-3xl border border-[#e7ebef] bg-white p-7 shadow-sm"><p className="text-sm font-black text-[#159548]">JOIN QUICKOLA</p><h1 className="mt-2 text-3xl font-black">Become a provider</h1><p className="mt-3 text-sm leading-6 text-[#657089]">Create your account, tell customers what you do, and receive suitable local job opportunities.</p><ProviderRegisterForm /><Link href="/pro/login" className="mt-5 block text-center text-sm font-black text-[#167d3c]">Already have an account? Sign in</Link></section></main>;
}
