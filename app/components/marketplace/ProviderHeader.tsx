import Link from "next/link";
import { providerSignOut } from "@/app/pro/actions";

export default function ProviderHeader() {
  return <header className="border-b border-[#e7ebef] bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/work" className="text-xl font-black tracking-[-.03em] text-[#061b3f]">Quickola</Link><nav className="flex items-center gap-4 text-sm font-black"><Link href="/work">Jobs</Link><Link href="/work/offers">My offers</Link><Link href="/messages">Messages</Link><Link href="/work/profile">Profile</Link><form action={providerSignOut}><button className="text-[#167d3c]">Sign out</button></form></nav></div></header>;
}
