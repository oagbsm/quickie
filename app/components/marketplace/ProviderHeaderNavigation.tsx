"use client";

import Link from "next/link";
import { providerSignOut } from "@/app/pro/actions";

export default function ProviderHeaderNavigation({ pending, unreadCount = 0 }: { pending: boolean; unreadCount?: number }) {
  const messageLabel = <span className="relative">Messages{unreadCount > 0 && <span className="ml-1 inline-block min-w-4 rounded-full bg-[#159548] px-1 text-center text-[10px] leading-4 text-white align-top">{unreadCount > 9 ? "9+" : unreadCount}</span>}</span>;
  const links = <><Link href="/work" className="min-h-11 flex items-center">Jobs</Link><Link href="/work/offers" className="min-h-11 flex items-center">My work</Link><Link href="/work/messages" className="min-h-11 flex items-center">{messageLabel}</Link><Link href="/work/payments" className="min-h-11 flex items-center">Payments</Link><Link href="/work/profile" className="min-h-11 flex items-center">Profile</Link></>;
  return pending ? <nav className="flex items-center text-sm font-black"><form action={providerSignOut}><button className="min-h-11 px-2 text-[#167d3c]">Sign out</button></form></nav> : <><nav className="hidden items-center gap-7 text-sm font-black sm:flex">{links}<form action={providerSignOut}><button className="min-h-11 text-[#167d3c]">Sign out</button></form></nav><nav className="flex items-center text-sm font-black sm:hidden"><form action={providerSignOut}><button className="min-h-11 px-2 text-[#167d3c]">Sign out</button></form></nav></>;
}
