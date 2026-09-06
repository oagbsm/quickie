"use client";

import Link from "next/link";
import { providerSignOut } from "@/app/pro/actions";

export default function ProviderHeaderNavigation({ pending }: { pending: boolean }) {
  const links = <><Link href="/work" className="min-h-11 flex items-center">Jobs</Link><Link href="/work/offers" className="min-h-11 flex items-center">My work</Link><Link href="/work/messages" className="min-h-11 flex items-center">Messages</Link><Link href="/work/payments" className="min-h-11 flex items-center">Payments</Link><Link href="/work/profile" className="min-h-11 flex items-center">Profile</Link></>;
  return pending ? <nav className="flex items-center text-sm font-black"><form action={providerSignOut}><button className="min-h-11 px-2 text-[#167d3c]">Sign out</button></form></nav> : <><nav className="hidden items-center gap-7 text-sm font-black sm:flex">{links}<form action={providerSignOut}><button className="min-h-11 text-[#167d3c]">Sign out</button></form></nav><details className="relative sm:hidden"><summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border border-[#dbe1ea] px-4 text-sm font-black [&::-webkit-details-marker]:hidden">Menu</summary><nav className="absolute right-0 top-14 z-50 grid w-52 gap-1 rounded-2xl border border-[#e7ebef] bg-white p-3 text-sm font-black shadow-xl" aria-label="Provider navigation">{links}<form action={providerSignOut}><button className="min-h-11 w-full text-left text-[#167d3c]">Sign out</button></form></nav></details></>;
}
