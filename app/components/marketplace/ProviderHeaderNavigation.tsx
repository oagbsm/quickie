"use client";

import Link from "next/link";
import { providerSignOut } from "@/app/pro/actions";

export default function ProviderHeaderNavigation({ pending }: { pending: boolean }) {
  return <nav className="flex items-center gap-4 text-sm font-black">{!pending && <><Link href="/work">Jobs</Link><Link href="/work/offers">My work</Link><Link href="/work/messages">Messages</Link><Link href="/work/profile">Profile</Link></>}<form action={providerSignOut}><button className="text-[#167d3c]">Sign out</button></form></nav>;
}
